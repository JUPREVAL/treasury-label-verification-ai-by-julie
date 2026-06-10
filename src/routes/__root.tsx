import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-landing-bg px-4"
      style={{
        backgroundImage: `radial-gradient(circle, var(--landing-grid) 1.2px, transparent 1.2px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-landing-dark">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-landing-dark">Page not found</h2>
        <p className="mt-2 text-sm text-landing-light-muted">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-landing-dark px-6 py-2 text-sm font-medium text-landing-light transition-colors hover:bg-landing-dark-subtle">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TTB Label Verification by JPreval" },
      { name: "description", content: "AI-powered alcohol beverage label verification prototype for the U.S. Treasury (TTB)." },
      { property: "og:title", content: "TTB Label Verification by JPreval" },
      { name: "twitter:title", content: "TTB Label Verification by JPreval" },
      { property: "og:description", content: "AI-powered alcohol beverage label verification prototype for the U.S. Treasury (TTB)." },
      { name: "twitter:description", content: "AI-powered alcohol beverage label verification prototype for the U.S. Treasury (TTB)." },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/faea940e-4e13-46db-b67e-3cf77d3c2d09/id-preview-3209b26f--14b08568-d70b-40f0-b9ea-5da3b43e08ed.lovable.app-1781065759821.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/faea940e-4e13-46db-b67e-3cf77d3c2d09/id-preview-3209b26f--14b08568-d70b-40f0-b9ea-5da3b43e08ed.lovable.app-1781065759821.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
