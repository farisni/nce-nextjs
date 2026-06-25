"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { BookOpen, BookMarked, Library, Globe } from "lucide-react";
import {
  Sidebar001,
  Sidebar001Header,
  Sidebar001Content,
  Sidebar001Group,
  Sidebar001Item,
} from "@/components/unlumen-ui/sidebar-001";
import { nce2List, nce3List, nce4List, ieltsList } from "@/app/mock";

const navGroups = [
  {
    label: "NCE2",
    icon: BookOpen,
    count: nce2List.length,
    defaultOpen: false,
    items: nce2List.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: `L${a.lesson} ${a.title}`,
    })),
  },
  {
    label: "NCE3",
    icon: BookMarked,
    count: nce3List.length,
    defaultOpen: false,
    items: nce3List.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: `L${a.lesson} ${a.title}`,
    })),
  },
  {
    label: "NCE4",
    icon: Library,
    count: nce4List.length,
    defaultOpen: true,
    items: nce4List.map((a) => ({
      id: a.id,
      isNew: a.keyArticle,
      label: `L${a.lesson} ${a.title}`,
    })),
  },
  {
    label: "IELTS",
    icon: Globe,
    count: ieltsList.length,
    defaultOpen: false,
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
  const router = useRouter();

  return (
    <Sidebar001 defaultWidth={260} minWidth={200} maxWidth={360}>
      <Sidebar001Header>
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg font-semibold">NCE BOOK</span>
        </div>
      </Sidebar001Header>

      <Sidebar001Content>
        {navGroups.map((group) => (
          <Sidebar001Group
            key={group.label}
            label={<>{group.label} <span className="ml-1 text-xs text-foreground/30"> {group.count}</span></>}
            icon={group.icon ? <group.icon className="size-3.5" /> : undefined}
            defaultOpen={group.defaultOpen}
            showChevron={false}
          >
            {group.items.map((item) => (
              <Sidebar001Item
                key={item.id}
                href={`/itles?article=${item.id}`}
                isNew={item.isNew}
                label={item.label}
                isActive={activeArticleId === item.id}
                onClick={(e) => { e.preventDefault(); router.push(`/itles?article=${item.id}`); }}
              />
            ))}
          </Sidebar001Group>
        ))}
      </Sidebar001Content>


    </Sidebar001>
  );
}
