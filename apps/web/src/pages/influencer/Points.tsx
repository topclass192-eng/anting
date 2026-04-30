import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ArrowLeft, Wallet, ArrowRight, Clock, PlusCircle, MinusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  description: string;
  createdAt: any;
}

export default function Points() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('국민은행');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPointsData = async () => {
    if (!user) return;
    try {
      const db = getFirestore();
      
      // Get current points
      const userRef = doc(db, 'influencers', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setPoints(userSnap.data()?.points || 0);
      }

      // Get transaction history
      const txRef = collection(db, 'transactions');
      const q = query(txRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const txSnap = await getDocs(q);
      
      const txs = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs);
      
    } catch (error) {
      console.error('Error fetching points data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointsData();
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount, 10);
    
    if (isNaN(amount) || amount < 10000) {
      alert('최소 출금 금액은 10,000원입니다.');
      return;
    }
    
    if (amount > points) {
      alert('보유 포인트가 부족합니다.');
      return;
    }

    if (!accountNumber || !accountHolder) {
      alert('계좌 정보를 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const functions = getFunctions();
      const withdrawCall = httpsCallable(functions, 'withdrawPoints');
      
      await withdrawCall({
        amount,
        bankName,
        accountNumber,
        accountHolder
      });
      
      alert('출금 신청이 완료되었습니다.');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setAccountNumber('');
      setAccountHolder('');
      
      // Refresh data
      fetchPointsData();
      
    } catch (error: any) {
      console.error('Withdraw error:', error);
      alert(error.message || '출금 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-900 ml-2">포인트 관리</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Points Summary */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Wallet size={20} />
              <span className="font-medium text-sm">출금 가능 포인트</span>
            </div>
            <div className="text-4xl font-bold mb-6 tracking-tight">
              {points.toLocaleString()}<span className="text-xl ml-1 font-normal opacity-80">P</span>
            </div>
            
            <button 
              onClick={() => setShowWithdraw(true)}
              className="w-full bg-white text-gray-900 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              포인트 출금하기
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Withdrawal Form Modal / Section */}
        {showWithdraw && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">출금 신청</h3>
              <button onClick={() => setShowWithdraw(false)} className="text-sm text-gray-500 underline">취소</button>
            </div>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">출금 금액 (최소 1만 P)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="출금할 포인트를 입력하세요"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium pr-8"
                    min="10000"
                    max={points}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">P</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">은행명</label>
                  <select 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium"
                  >
                    <option>국민은행</option>
                    <option>신한은행</option>
                    <option>우리은행</option>
                    <option>하나은행</option>
                    <option>농협은행</option>
                    <option>카카오뱅크</option>
                    <option>토스뱅크</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">계좌번호 (숫자만)</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="계좌번호 입력"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">예금주</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="예금주 성명 입력"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-medium"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-blue-200"
              >
                {submitting ? '처리 중...' : '신청하기'}
              </button>
            </form>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            이용 내역
          </h3>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500">포인트 내역이 없습니다.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'earn' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {tx.type === 'earn' ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-0.5">{tx.description}</p>
                      <p className="text-[10px] text-gray-400">
                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : '방금 전'}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${tx.type === 'earn' ? 'text-blue-600' : 'text-red-600'}`}>
                    {tx.type === 'earn' ? '+' : ''}{tx.amount.toLocaleString()}P
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
