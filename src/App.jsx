import { BrowseScreen } from './screens/BrowseScreen';
import { useNewsletterData } from './hooks/useNewsletterData';

export default function App() {
  const data = useNewsletterData();

  return <BrowseScreen data={data} />;
}
