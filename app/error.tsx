"use client";
export default function Error({reset}:{error:Error;reset:()=>void}){return <main className="uxState" role="alert"><h1>Something didn’t load</h1><p>Please try again. Your saved account data has not been changed.</p><button className="aurynPrimary" onClick={reset}>Try again</button><a href="/analyze">Back to Research</a></main>}
