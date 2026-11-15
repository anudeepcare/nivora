# Operational labels and attribution are different

Public official documents checked 15 November 2026:

- Twelve Data requires visible nearby linked attribution for external/client-facing display unless a contract explicitly waives it. An info dialog alone does not meet its stated visible-nearby guidance. https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data
- SentiSense Data License v1.2 section 4.6 describes optional attribution, with a 25% discount when elected. The accepted license version, plan and election have not been verified for this account. Its ordinary API terms and third-party data limitations are separate. https://sentisense.ai/agreement/data-license/
- EODHD says commercial display needs a commercial license; applicable terms depend on use. No account-specific commercial agreement was available in this source review. https://eodhd.com/help/commercial

This patch simplifies operational metadata and explanatory copy. It does not remove explicit contractual credit components, change account licenses, enable public data access, or establish a white-label right. Raw source fields remain intact. Publisher bylines and filing/company source links remain. Existing provider-redaction behavior predates this patch and must not be treated as evidence that public deployment is licensed or attribution-compliant.

Before public production release, verify the accepted commercial agreements and any required visible credits. Paying for API access alone does not establish a no-attribution right. This is an unresolved release gate, not a UI calculation bug.
