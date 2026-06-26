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
      route: "/nec2",
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
      route: "/nec3",
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
      route: "/nec4",
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
      route: "/itles",
    })),
  },
  {
    label: "Words",
    icon: BookOpen,
    count: 5,
    defaultOpen: false,
    items: [
      {
        id: "vocabulary",
        isNew: true,
        label: "雅思词汇真经",
        route: "/vocabulary",
      },
      {
        id: "538-keywords",
        isNew: true,
        label: "538 考点词",
        route: "/538-keywords",
      },
      {
        id: "nce2-vocabulary",
        isNew: true,
        label: "NCE2 单词",
        route: "/nce-vocabulary/nce2",
      },
      {
        id: "nce3-vocabulary",
        isNew: true,
        label: "NCE3 单词",
        route: "/nce-vocabulary/nce3",
      },
      {
        id: "nce4-vocabulary",
        isNew: true,
        label: "NCE4 单词",
        route: "/nce-vocabulary/nce4",
      },
    ],
  },
];

const routeDefaultArticleIds: Record<string, string | undefined> = {
  "/nec2": nce2List[0]?.id,
  "/nec3": nce3List[0]?.id,
  "/nec4": nce4List[0]?.id,
  "/itles": ieltsList[0]?.id,
};

function isTableRoute(id: string) {
  return id === "vocabulary"
    || id === "538-keywords"
    || id === "nce2-vocabulary"
    || id === "nce3-vocabulary"
    || id === "nce4-vocabulary";
}

function getItemHref(item: { id: string; route: string }) {
  return item.route + (isTableRoute(item.id) ? "" : `?article=${item.id}`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const articleParam = searchParams.get("article") ?? "";
  const router = useRouter();
  const currentRouteItems = navGroups.flatMap((group) =>
    group.items.filter((item) => !isTableRoute(item.id) && item.route === pathname),
  );
  const activeArticleId = currentRouteItems.some((item) => item.id === articleParam)
    ? articleParam
    : routeDefaultArticleIds[pathname] ?? "";
  const hasCurrentRouteGroup = navGroups.some((group) =>
    group.items.some((item) => item.route === pathname),
  );

  return (
    <Sidebar001 defaultWidth={210} minWidth={170} maxWidth={290} className="lg:sticky lg:top-6 lg:h-[calc(100svh-3rem)] lg:self-start">
      <Sidebar001Header className="flex items-center justify-between gap-4 px-0 pb-2 pt-0">
        <div className="flex -translate-y-1 items-center gap-2">
          <span className="text-2xl font-bold">NCE BOOK</span>
        </div>
      </Sidebar001Header>

      <Sidebar001Content className="pl-0" contentClassName="pl-0 pr-4">
        {navGroups.map((group) => {
          const isGroupActive = group.items.some((item) => item.route === pathname);
          const shouldOpen = isGroupActive || (!hasCurrentRouteGroup && group.defaultOpen);

          return (
            <Sidebar001Group
              key={`${group.label}-${shouldOpen ? "open" : "closed"}`}
              label={<>{group.label} <span className="ml-1 text-xs text-foreground/30"> {group.count}</span></>}
              icon={group.icon ? <group.icon className="size-3.5" /> : undefined}
              defaultOpen={shouldOpen}
              showChevron={false}
            >
              {group.items.map((item) => {
                const href = getItemHref(item);
                const isActive = isTableRoute(item.id)
                  ? pathname === item.route
                  : pathname === item.route && activeArticleId === item.id;

                return (
                  <Sidebar001Item
                    key={item.id}
                    href={href}
                    isNew={item.isNew}
                    label={item.label}
                    isActive={isActive}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(href);
                    }}
                  />
                );
              })}
            </Sidebar001Group>
          );
        })}
      </Sidebar001Content>


    </Sidebar001>
  );
}
