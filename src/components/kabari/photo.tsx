import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export function ScrapPhoto({ path }: { path: string }) {
  const { data: url } = useQuery({
    queryKey: ["photo-url", path],
    queryFn: async () => {
      const { data } = await supabase.storage.from("scrap-photos").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  });

  return (
    <div className="overflow-hidden rounded-xl bg-glass">
      <div className="grid aspect-[4/3] w-full place-items-center bg-secondary">
        {url ? (
          <img src={url} alt="Scrap photo" className="size-full object-cover" />
        ) : (
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Photo
          </span>
        )}
      </div>
    </div>
  );
}

export function ScrapPhotoGrid({ paths }: { paths: string[] | null }) {
  if (!paths?.length) {
    return (
      <div className="rounded-xl bg-glass p-4 text-sm text-muted-foreground">
        No photos were added to this request.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {paths.map((path) => (
        <ScrapPhoto key={path} path={path} />
      ))}
    </div>
  );
}
