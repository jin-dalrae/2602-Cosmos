import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyCmzPdsiga2bN81KSf2lzbw4JbqTLQb_ik',
  authDomain: 'cosmos-3f667.firebaseapp.com',
  projectId: 'cosmos-3f667',
  storageBucket: 'cosmos-3f667.firebasestorage.app',
  messagingSenderId: '797822714074',
  appId: '1:797822714074:web:e31871259915a4b7e725e3',
  measurementId: 'G-HRRGSN7HMJ',
}

export const app = initializeApp(firebaseConfig)

// Initialize Analytics only in browser environments that support it
isSupported().then(supported => {
  if (supported) {
    getAnalytics(app)
  }
})
