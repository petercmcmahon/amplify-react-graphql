/**
 * Illustrative, hand-curated headlines paraphrasing well-known real AI/tech
 * industry events (Oct 2022 - Jul 2023) — not scraped from any publisher, no
 * verified source URLs. Embedded as a string (rather than read from a file
 * at runtime) so it survives esbuild bundling into a Lambda deployment
 * package without needing an extra asset-copy step.
 */
export const SEED_HEADLINES_CSV = `ticker,text,url,publishedAt
NVDA,"Nvidia forecasts data center growth as AI chip demand accelerates",,2022-11-16
NVDA,"Analysts flag Nvidia as key beneficiary of new ChatGPT-driven AI boom",,2022-12-01
NVDA,"Nvidia shares rally on optimism over generative AI chip orders",,2023-01-26
NVDA,"Nvidia quarterly results beat estimates on strength in AI-related GPU sales",,2023-02-22
NVDA,"Nvidia unveils new AI supercomputing platform at GTC conference",,2023-03-21
NVDA,"Nvidia partners with Microsoft and others on generative AI cloud services",,2023-04-18
NVDA,"Nvidia issues blowout revenue guidance citing surging AI chip demand",,2023-05-24
NVDA,"Nvidia shares surge to record high after AI-driven earnings guidance",,2023-05-25
NVDA,"Nvidia briefly crosses one trillion dollar market capitalization",,2023-05-30
NVDA,"Nvidia stock climbs as AI server demand outlook remains strong",,2023-06-13
MSFT,"OpenAI launches ChatGPT, drawing attention to Microsoft-backed AI research",,2022-11-30
MSFT,"Microsoft in talks to expand investment in OpenAI",,2023-01-10
MSFT,"Microsoft announces multibillion dollar investment in OpenAI",,2023-01-23
MSFT,"Microsoft unveils new AI-powered Bing search with OpenAI technology",,2023-02-07
MSFT,"Microsoft shares rise on new AI-integrated Bing and Edge rollout",,2023-02-08
MSFT,"Microsoft introduces Copilot AI assistant across Office apps",,2023-03-16
MSFT,"Microsoft expands Azure AI services for enterprise customers",,2023-04-11
MSFT,"Microsoft touts AI-driven Azure growth ahead of earnings",,2023-05-23
MSFT,"Microsoft stock gains as investors bet on AI-driven cloud demand",,2023-06-01
GOOGL,"Google announces Bard, its answer to ChatGPT",,2023-02-06
GOOGL,"Google shares fall after Bard demo includes factual error",,2023-02-08
GOOGL,"Google opens access to PaLM AI language model for developers",,2023-03-14
GOOGL,"Google unveils new generative AI features at I/O conference",,2023-05-10
GOOGL,"Google shares rise after AI product announcements at I/O",,2023-05-11
GOOGL,"Google integrates generative AI into search results in limited test",,2023-05-30
GOOGL,"Google expands AI investment across cloud and search products",,2023-06-08
GOOGL,"Google touts AI-driven ad targeting improvements",,2023-06-20
META,"Meta signals increased AI infrastructure spending in earnings call",,2023-02-01
META,"Meta's LLaMA AI language model leaks online, sparking research interest",,2023-02-24
META,"Meta announces new generative AI features for advertisers",,2023-03-14
META,"Meta forms new generative AI product team",,2023-04-05
META,"Meta releases open research tools for AI model training",,2023-05-18
META,"Meta shares rise on AI-driven ad targeting improvements",,2023-05-19
META,"Meta touts AI investments as key to long-term growth",,2023-06-01
META,"Meta expands AI chip development efforts to reduce cloud costs",,2023-06-22
AMD,"AMD signals growing interest in AI accelerator chips",,2023-01-31
AMD,"AMD unveils new AI-focused chip roadmap",,2023-03-01
AMD,"AMD shares slip despite highlighting new AI chip lineup",,2023-04-19
AMD,"AMD teams up with major cloud providers on AI accelerators",,2023-05-16
AMD,"AMD to unveil new MI300 AI accelerator chips at Computex",,2023-06-12
AMD,"AMD shares rise after MI300 AI chip launch event",,2023-06-13
AMD,"Analysts raise price targets on AMD citing AI chip opportunity",,2023-06-14
AMD,"AMD expands partnerships to compete with Nvidia in AI chips",,2023-06-27
PLTR,"Palantir highlights new AI platform initiatives for government clients",,2023-01-05
PLTR,"Palantir launches Artificial Intelligence Platform (AIP) for enterprises",,2023-04-26
PLTR,"Palantir shares jump on new AI platform launch",,2023-04-27
PLTR,"Palantir holds AI bootcamps to showcase new AIP demand",,2023-05-08
PLTR,"Palantir raises full-year guidance citing strong AI platform demand",,2023-05-22
PLTR,"Palantir shares surge after AI-driven earnings beat",,2023-05-23
PLTR,"Palantir expands AI platform deals with new enterprise customers",,2023-06-05
PLTR,"Analysts highlight Palantir's AI momentum following AIP rollout",,2023-06-19
SMCI,"Super Micro Computer reports strong demand for AI server hardware",,2023-01-31
SMCI,"Supermicro shares climb on growing AI server order backlog",,2023-02-13
SMCI,"Super Micro highlights new AI server designs built around Nvidia GPUs",,2023-03-06
SMCI,"Supermicro raises revenue guidance on surging AI server demand",,2023-05-04
SMCI,"Supermicro shares surge after AI server demand outlook raised",,2023-05-05
SMCI,"Super Micro expands AI server production capacity",,2023-06-08
SMCI,"Supermicro shares rally as AI infrastructure spending accelerates",,2023-06-21
SMCI,"Analysts note Supermicro's tight supply chain amid AI server demand",,2023-06-29
AMZN,"Amazon launches Bedrock, a new generative AI service for AWS customers",,2023-04-13
AMZN,"Amazon shares rise on new generative AI cloud offering",,2023-04-14
AMZN,"Amazon expands AI chip offerings for AWS customers",,2023-05-24
AMZN,"Amazon touts AI investments across retail and cloud businesses",,2023-06-01
AMZN,"Amazon partners with AI startups to expand Bedrock ecosystem",,2023-06-13
AMZN,"Amazon Web Services highlights growing generative AI customer demand",,2023-06-22
AMZN,"Amazon shares gain as investors weigh AI-driven AWS growth",,2023-06-30
AMZN,"Analysts raise Amazon estimates on AI cloud services momentum",,2023-07-05
`;
