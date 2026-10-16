import HelpQuestions from "@/components/HelpQuestions";
import Link from "next/link";
import SecondaryFrame from "../secondary-frame";
export default function FAQ(){return <SecondaryFrame eyebrow="AURYN / HELP CENTER" title="Clarity, one answer at a time." intro="Tap a question for the short explanation."><div className="secondaryHelpLinks"><Link href="/methodology">Explore the methodology →</Link><Link href="/personalization">Manage your preferences →</Link><Link href="/trading-lab">Explore paper trading →</Link></div><HelpQuestions/></SecondaryFrame>}
