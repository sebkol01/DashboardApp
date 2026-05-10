import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useFirestore(section, initialValue) {
  const { currentUser } = useAuth()
  const [data, setLocalData] = useState(initialValue)
  const [loading, setLoading] = useState(true)
  const initialRef = useRef(initialValue)

  useEffect(() => {
    if (!currentUser) return
    const ref = doc(db, 'users', currentUser.uid, 'sections', section)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLocalData(snap.exists() ? snap.data() : initialRef.current)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [currentUser, section])

  const setData = async (updater) => {
    if (!currentUser) return
    const next = typeof updater === 'function' ? updater(data) : updater
    setLocalData(next)
    const ref = doc(db, 'users', currentUser.uid, 'sections', section)
    await setDoc(ref, next)
  }

  return [data, setData, loading]
}
