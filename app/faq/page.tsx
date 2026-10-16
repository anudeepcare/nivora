import HelpQuestions from "@/components/HelpQuestions";
import Link from "next/link";
import SecondaryFrame from "../secondary-frame";
export default function FAQ(){return <SecondaryFrame eyebrow="AURYN / HELP CENTER" title="A little clarity goes a long way." intro="Understand the research, interpret the evidence, and get more from your workspace."><div className="secondaryHelpLinks"><Link href="/methodology">Explore the methodology →</Link><Link href="/personalization">Manage your preferences →</Link><Link href="/trading-lab">Explore paper trading →</Link></div><HelpQuestions/></SecondaryFrame>}
