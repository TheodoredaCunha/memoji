import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { updateDoc } from 'firebase/firestore';


export type KanjiData = {
  id?: string;
  kanji: string;
  reading: string;
  meaning: string;
  notes?: string;
  createdAt?: string;
};

function userKanjiCollection(uid: string) {
  return collection(db, 'users', uid, 'savedKanji');
}

export async function saveKanji(uid: string, kanji: KanjiData) {
  const col = userKanjiCollection(uid);
  const payload: Record<string, unknown> = {
    kanji: kanji.kanji,
    reading: kanji.reading,
    meaning: kanji.meaning,
    notes: kanji.notes || '',
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function removeKanji(uid: string, kanjiId: string) {
  const d = doc(db, 'users', uid, 'savedKanji', kanjiId);
  await deleteDoc(d);
}

export async function getSavedKanji(uid: string) {
  const col = userKanjiCollection(uid);
  const q = query(col, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      kanji: String(data.kanji || ''),
      reading: String(data.reading || ''),
      meaning: String(data.meaning || ''),
      notes: String(data.notes || ''),
      exampleSentence: data.exampleSentence
        ? {
            sentence: String(data.exampleSentence.sentence || ''),
            reading: String(data.exampleSentence.reading || ''),
            english: String(data.exampleSentence.english || ''),
          }
        : undefined,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '',
    } as KanjiData & { id: string };
  });
}

export async function updateKanjiNotes(
  uid: string,
  kanjiId: string,
  notes: string
) {
  const d = doc(db, 'users', uid, 'savedKanji', kanjiId);

  await updateDoc(d, {
    notes
  });
}