"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  Sidebar001,
  Sidebar001Header,
  Sidebar001Content,
  Sidebar001Group,
  Sidebar001Item,
  Sidebar001Footer,
} from "@/components/unlumen-ui/sidebar-001";
import { nce2List, nce3List, nce4List, ieltsList } from "@/app/mock";

const navGroups = [
  {
    label: "NCE2",
    items: nce2List.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: `L${a.lesson} ${a.titleCn ?? a.title}`,
    })),
  },
  {
    label: "NCE3",
    items: nce3List.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: `L${a.lesson} ${a.titleCn ?? a.title}`,
    })),
  },
  {
    label: "NCE4",
    items: nce4List.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: `L${a.lesson} ${a.titleCn ?? a.title}`,
    })),
  },
  {
    label: "IELTS",
    items: ieltsList.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: a.title,
    })),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeArticleId = searchParams.get("article") ?? "";

  return (
    <Sidebar001 defaultWidth={260} minWidth={200} maxWidth={360}>
      <Sidebar001Header>
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg font-semibold">NCE</span>
        </div>
      </Sidebar001Header>

      <Sidebar001Content>
        {navGroups.map((group) => (
          <Sidebar001Group
            key={group.label}
            label={group.label}
            defaultOpen={true}
          >
            {group.items.map((item) => (
              <Sidebar001Item
                key={item.id}
                href={`/itles?article=${item.id}`}
                isNew={item.isNew}
                label={item.label}
                isActive={activeArticleId === item.id}
              />
            ))}
          </Sidebar001Group>
        ))}
      </Sidebar001Content>

      <Sidebar001Footer>
        <div className="px-3 py-2 text-xs text-foreground/30">
          NCE Reading
        </div>
      </Sidebar001Footer>
    </Sidebar001>
  );
}
