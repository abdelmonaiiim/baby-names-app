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
  const [activeTab, setActiveTab] = useState<string>('suggest');
  const [names, setNames] = useState<NameData[]>([]);
  const [newName, setNewName] = useState<string>('');
  
  // حماية الإدارة
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');

  // منع التصويت المتكرر
  const [votedNames, setVotedNames] = useState<string[]>([]);

  useEffect(() => {
    // ملي كيتحل التطبيق، كنقلبو واش هاد السيد ديجا صوت على شي سميات
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
    if (newName.trim() === '') return;
    
    await addDoc(collection(db, 'names'), {
      text: newName,
      status: 'pending',
      votes: 0
    });
    setNewName('');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const nameRef = doc(db, 'names', id);
    await updateDoc(nameRef, { status: newStatus });
  };

  const handleVote = async (id: string) => {
    // إلى كان ديجا صوت على هاد السمية، ما نديرو والو
    if (votedNames.includes(id)) return;

    const nameRef = doc(db, 'names', id);
    await updateDoc(nameRef, { votes: increment(1) });

    // كنسجلو السمية لي صوت عليها باش ما يعاودش
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
          <button onClick={() => setActiveTab('suggest')} className={`flex-1 pb-2 ${activeTab === 'suggest' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>اقتراح</button>
          <button onClick={() => setActiveTab('vote')} className={`flex-1 pb-2 ${activeTab === 'vote' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>تصويت</button>
          <button onClick={() => setActiveTab('admin')} className={`flex-1 pb-2 ${activeTab === 'admin' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>الإدارة</button>
        </div>

        {activeTab === 'suggest' && (
          <div>
            <form onSubmit={handleSuggest} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="كتب السمية هنا..."
                className="flex-1 border rounded-lg px-4 py-2 text-black"
              />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">إرسال</button>
            </form>
          </div>
        )}

        {activeTab === 'vote' && (
          <div className="space-y-4">
            {approvedNames.sort((a, b) => b.votes - a.votes).map(name => {
              const percentage = totalVotes === 0 ? 0 : Math.round((name.votes / totalVotes) * 100);
              const hasVoted = votedNames.includes(name.id); // واش هاد السيد ديجا صوت هنا؟
              
              return (
                <div key={name.id} className="bg-gray-100 p-3 rounded-lg flex items-center justify-between text-black">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{name.text}</span>
                      <span className="text-sm">{percentage}% ({name.votes})</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleVote(name.id)} 
                    disabled={hasVoted}
                    className={`ml-4 w-10 h-10 rounded-full font-bold mr-4 text-white flex items-center justify-center transition-colors ${
                      hasVoted ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {hasVoted ? '✓' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-3">
            {!isAdminAuth ? (
              <div className="flex flex-col items-center gap-4 mt-6">
                <p className="text-gray-600 font-semibold">هاد البلاصة خاصة بالأب والأم فقط</p>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="الكود السري"
                  className="border rounded-lg px-4 py-2 text-black text-center"
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
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  دخول
                </button>
              </div>
            ) : (
              <>
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-4 text-sm rounded">
                  مرحبا، دابا تقدرو تقبلو ولا ترفضو السميات.
                </div>
                {names.filter(n => n.status === 'pending').map(name => (
                  <div key={name.id} className="flex justify-between items-center border p-3 rounded-lg text-black">
                    <span className="font-bold">{name.text}</span>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(name.id, 'approved')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded">قبول ✓</button>
                      <button onClick={() => updateStatus(name.id, 'rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded">رفض ✕</button>
                    </div>
                  </div>
                ))}
                {names.filter(n => n.status === 'pending').length === 0 && (
                  <p className="text-gray-500 text-center mt-4">ما كاين حتى اقتراح جديد دابا.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}