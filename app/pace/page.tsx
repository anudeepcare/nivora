import PublicEducation from "@/components/PublicEducation";
import { routeMetadata } from "@/lib/site-metadata";
export const metadata = routeMetadata("/pace");
export default function Pace() {
  return <PublicEducation pace />;
}
