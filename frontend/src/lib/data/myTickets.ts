import type { MyTicket } from "@/lib/types";

export const myTickets: MyTicket[] = [
  {
    id: "t1",
    status: "upcoming",
    category: "Music Festival",
    title: "Summer Solstice Music Festival",
    date: "Oct 24, 2023",
    time: "7:00 PM",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAocD49wB-L_ABM_iN-kiKJ7GgYJCKVIDh27iQvWbLI66k_uezXMJYl_lzVjHhElu0xYpEu5Nzs3W2xkfjs0zIEZ-f4w22aet3S2-OM7rUOyLb0PRvP3-iE7xxbPRp80tGfZrIMa7V-kQebaAUASu2aMI68PNF8aQsEu9GizW_fp4-99fehhmOf8XYa96HsIOdEiYMJWyQjBnxIfrg4DY2Bjzix743RpwWL0QCy60M6h1ODRjRij-R7xqHfvBav2LEsNfBrKAfT8w-z",
    imageAlt: "Atmospheric summer music festival crowd with lights",
  },
  {
    id: "t2",
    status: "upcoming",
    category: "Conference",
    title: "Global Tech Summit 2023",
    date: "Nov 12, 2023",
    time: "9:00 AM",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB-vkutgpHbxc36_4e1Wb8VES28ll75rX_617qFwjhzUYRKI1PbUgRrDiD4Soby13pqqPAtVGU0aYNNg7S8xWMKcLl4AwtuTYV0lqr4qDt0_KJ9n8RNlePxBzBqRWqJCgLp9gFnu2YGUmqSboUFNkHPfVanypDWK3KmBwN03mYyBZ9P2yFy_9_0756M55Sz8f5xdSvBLalxKIetiAuViCgUVOZ3zcTiSxeOO6Z9E-pCXusfF3_l2sFrscWKGbx1SgV_t93xdX2rKSY2",
    imageAlt: "People networking at a professional tech conference",
  },
  {
    id: "t3",
    status: "attended",
    category: "Theatre",
    title: "Neon Dreams: The Musical",
    date: "Sep 15, 2023",
    time: "8:30 PM",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9Lb0tHEu5WbrAYSrW7O0rog1yw35_m2PHSao7iKpdbnKTVwKGUrlbEJ3XPh6vTzpLr83_l0boPKX2q9O3kO3xkfUHAbBWcJ9eucaG8K0oFA-H_NK6x9KbUMBHtJA1fFUFc7nCwvvFLieBoEH_ynw4D40UosrhovErpdlht-Mpsh2jeG4MXLljNWqNB0rC3e9gt7Vdk9gTJs7I6SmL8vzwxX-x1FJTRNCsGqtJrpvA-tg320Ln88-kt5ls7KJbKpTA-4DrtL-bolJt",
    imageAlt: "Blurred crowd at a stadium event",
  },
];