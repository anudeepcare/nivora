import PublicEducation from "@/components/PublicEducation";
import { routeMetadata } from "@/lib/site-metadata";
export const metadata = routeMetadata("/about");
export default function About() {
  return <PublicEducation />;
}
