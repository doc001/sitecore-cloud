// src/app/oso/programs/page.tsx
export const dynamic = "force-static"; // or: export const revalidate = 3600;

type ProgramMajor = { name: string; url: string };
type Program = {
  name: string;
  url: string;
  credential_type?: string;
  majors?: ProgramMajor[];
};

type CredentialGroup = {
  name: string;
  programs: Program[];
};

type School = {
  school_name: string;
  school_url: string;
  credentials: CredentialGroup[];
};

type ProgramsJson = { schools: School[] };

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeCredentialName(name: string) {
  // Optional: tighten grouping labels so Copilot can read them consistently
  return name.trim();
}

export default async function ProgramsHtmlPage() {
  const res = await fetch("https://bvc-app.vercel.app/oso/programs.json", {
    // If you want it to refresh occasionally:
    // next: { revalidate: 3600 },
    cache: "force-cache",
  });

  if (!res.ok) {
    return (
      <main style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1>Programs</h1>
        <p>Could not load programs catalog. Status: {res.status}</p>
      </main>
    );
  }

  const data = (await res.json()) as ProgramsJson;

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.5, maxWidth: 1100, margin: "0 auto" }}>
      <header>
        <h1>Bow Valley College Programs</h1>
        <p>
          This page is generated from the programs catalog JSON and is intended to be readable by people and search/crawlers.
        </p>
        <p>
          Source JSON:{" "}
          <a href="https://bvc-app.vercel.app/oso/programs.json">https://bvc-app.vercel.app/oso/programs.json</a>
        </p>
      </header>

      <hr />

      {data.schools?.map((school) => (
        <section key={school.school_url} style={{ marginTop: 28 }}>
          <h2 id={slugify(school.school_name)}>{school.school_name}</h2>
          <p>
            School page: <a href={school.school_url}>{school.school_url}</a>
          </p>

          {school.credentials?.map((cred) => (
            <div key={cred.name} style={{ marginTop: 18 }}>
              <h3>{normalizeCredentialName(cred.name)}</h3>

              <ul>
                {cred.programs?.map((p) => (
                  <li key={p.url} style={{ marginBottom: 10 }}>
                    <a href={p.url}>{p.name}</a>

                    {/* If you want majors visible as their own items (very helpful for crawlers): */}
                    {Array.isArray(p.majors) && p.majors.length > 0 && (
                      <ul style={{ marginTop: 6 }}>
                        {p.majors.map((m) => (
                          <li key={m.url}>
                            <a href={m.url}>{m.name}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}