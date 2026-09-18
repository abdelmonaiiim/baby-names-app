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
    const nameRef = doc(db, 'names', id);
    await updateDoc(nameRef, { votes: increment(1) });
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
                  <button onClick={() => handleVote(name.id)} className="ml-4 bg-green-500 text-white w-10 h-10 rounded-full font-bold mr-4">+</button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-3">
            {names.filter(n => n.status === 'pending').map(name => (
              <div key={name.id} className="flex justify-between items-center border p-3 rounded-lg text-black">
                <span className="font-bold">{name.text}</span>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(name.id, 'approved')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded">قبول ✓</button>
                  <button onClick={() => updateStatus(name.id, 'rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded">رفض ✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}