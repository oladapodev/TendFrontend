import { useRoute } from './router.js'
import Landing from './landing/Landing.jsx'
import WebApp from './app/WebApp.jsx'

export default function App() {
  const route = useRoute()
  if (route.startsWith('/app')) return <WebApp route={route} />
  return <Landing />
}
