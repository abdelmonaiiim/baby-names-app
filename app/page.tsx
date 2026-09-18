"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

interface NameData {
  id: string;
  text: string;
  status: string;
  votes: number;
}

export default function BabyNameApp() {
  // دابا عندنا غير 2 واجهات: الرئيسية (فيها الاقتراح والتصويت) والإدارة
  const [activeTab, setActiveTab] = useState<string>('home');
  const [names, setNames] = useState<NameData[]>([]);
  const [newName, setNewName] = useState<string>('');
  
  // حماية الإدارة
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');

  // منع التصويت المتكرر
  const [votedNames, setVotedNames] = useState<string[]>([]);

  useEffect(() => {
    const savedVotes = localStorage.getItem('votedBabyNames');
    if (savedVotes) {
      setVotedNames(JSON.parse(savedVotes));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'names'), (snapshot) => {
      const namesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NameData[];
      setNames(namesData);
    });
    return () => unsubscribe();
  }, []);

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (trimmedName === '') return;

    // نقلبو واش السمية ديجا كاينة (سواء مقبولة ولا باقا فـ pending)
    const alreadyExists = names.find(n => n.text === trimmedName);
    if (alreadyExists) {
      alert('هاد السمية ديجا كاينة! قلب عليها لتحت وصوت عليها.');
      return;
    }
    
    await addDoc(collection(db, 'names'), {
      text: trimmedName,
      status: 'pending',
      votes: 0
    });
    setNewName('');
    alert('تم إرسال الاقتراح للأب والأم للموافقة!');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const nameRef = doc(db, 'names', id);
    await updateDoc(nameRef, { status: newStatus });
  };

  const handleVote = async (id: string) => {
    if (votedNames.includes(id)) return;

    const nameRef = doc(db, 'names', id);
    await updateDoc(nameRef, { votes: increment(1) });

    const updatedVotes = [...votedNames, id];
    setVotedNames(updatedVotes);
    localStorage.setItem('votedBabyNames', JSON.stringify(updatedVotes));
  };

  const approvedNames = names.filter(n => n.status === 'approved');
  const totalVotes = approvedNames.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">👶 سمية البطل</h1>
        
        <div className="flex justify-between border-b mb-6 pb-2">
          <button onClick={() => setActiveTab('home')} className={`flex-1 pb-2 ${activeTab === 'home' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>الرئيسية</button>
          <button onClick={() => setActiveTab('admin')} className={`flex-1 pb-2 ${activeTab === 'admin' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}>الإدارة</button>
        </div>

        {activeTab === 'home' && (
          <div className="animate-fade-in">
            {/* قسم الاقتراح */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h2 className="text-lg font-semibold text-blue-800 mb-3">اقترح سمية جديدة:</h2>
              <form onSubmit={handleSuggest} className="flex gap-2">
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="كتب السمية هنا..."
                  className="flex-1 border rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">إرسال</button>
              </form>
            </div>

            {/* قسم التصويت */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800">صوت على أحسن سمية:</h2>
            {approvedNames.length === 0 ? (
              <p className="text-gray-500 text-center py-4">باقي ما كاين حتى سمية للتصويت، كون نتا الأول لي يقترح!</p>
            ) : (
              <div className="space-y-4">
                {approvedNames.sort((a, b) => b.votes - a.votes).map(name => {
                  const percentage = totalVotes === 0 ? 0 : Math.round((name.votes / totalVotes) * 100);
                  const hasVoted = votedNames.includes(name.id);
                  
                  return (
                    <div key={name.id} className="bg-gray-100 p-3 rounded-lg flex items-center justify-between text-black shadow-sm">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-lg">{name.text}</span>
                          <span className="text-sm font-medium text-gray-600">{percentage}% ({name.votes} صوت)</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleVote(name.id)} 
                        disabled={hasVoted}
                        className={`ml-4 w-12 h-12 rounded-full font-bold mr-4 text-white flex items-center justify-center text-xl transition-colors shadow-sm ${
                          hasVoted ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:scale-95'
                        }`}
                      >
                        {hasVoted ? '✓' : '+'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-3 animate-fade-in">
            {!isAdminAuth ? (
              <div className="flex flex-col items-center gap-4 mt-6">
                <p className="text-gray-600 font-semibold">هاد البلاصة خاصة بالأب والأم فقط</p>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="الكود السري"
                  className="border rounded-lg px-4 py-2 text-black text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button 
                  onClick={() => {
                    if (passwordInput === '2026') {
                      setIsAdminAuth(true);
                    } else {
                      alert('الكود غالط!');
                      setPasswordInput('');
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  دخول
                </button>
              </div>
            ) : (
              <>
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 text-sm rounded">
                  مرحبا، دابا تقدرو تقبلو ولا ترفضو السميات باش يبانو للناس يصوتو عليهم.
                </div>
                {names.filter(n => n.status === 'pending').map(name => (
                  <div key={name.id} className="flex justify-between items-center border p-3 rounded-lg text-black bg-white shadow-sm">
                    <span className="font-bold text-lg">{name.text}</span>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(name.id, 'approved')} className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-md hover:bg-blue-100 transition-colors font-medium">قبول ✓</button>
                      <button onClick={() => updateStatus(name.id, 'rejected')} className="bg-red-50 text-red-700 border border-red-200 px-4 py-1.5 rounded-md hover:bg-red-100 transition-colors font-medium">رفض ✕</button>
                    </div>
                  </div>
                ))}
                {names.filter(n => n.status === 'pending').length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block">📭</span>
                    <p className="text-gray-500">ما كاين حتى اقتراح جديد دابا.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}