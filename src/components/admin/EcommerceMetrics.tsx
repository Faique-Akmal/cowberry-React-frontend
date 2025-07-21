import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  
  
  GroupIcon,
} from "../../icons";

// import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
  const cards = [
  {
    title: "Total User",
    value: "40,689",
    icon: <GroupIcon className="h-6 w-6 text-indigo-500" />,
    iconBg: "bg-indigo-100",
    trend: "8.5%",
    trendText: "Up from yesterday",
    trendColor: "text-emerald-500",
    arrow: <ArrowUpIcon className="h-4 w-4 text-emerald-500 mr-1" />,
  },
  {
    title: "Total Order",
    value: "10,293",
    icon: <GroupIcon className="h-6 w-6 text-yellow-500" />,
    iconBg: "bg-yellow-100",
    trend: "1.3%",
    trendText: "Up from past week",
    trendColor: "text-emerald-500",
    arrow: < ArrowUpIcon className="h-4 w-4 text-emerald-500 mr-1" />,
  },
  {
    title: "Total Sales",
    value: "$89,000",
    icon: <GroupIcon className="h-6 w-6 text-green-500" />,
    iconBg: "bg-green-100",
    trend: "4.3%",
    trendText: "Down from yesterday",
    trendColor: "text-rose-500",
    arrow: < ArrowDownIcon className="h-4 w-4 text-rose-500 mr-1" />,
  },
  {
    title: "Total Pending",
    value: "2040",
    icon:   <BoxIconLine className="h-6 w-6 text-green-500" />,

    iconBg: "bg-orange-100",
    trend: "1.8%",
    trendText: "Up from yesterday",
    trendColor: "text-emerald-500",
    arrow: < ArrowUpIcon className="h-4 w-4 text-emerald-500 mr-1" />,
  },
];
  return (
      <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm text-gray-500 font-medium">{card.title}</h4>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`p-2 rounded-full ${card.iconBg}`}>{card.icon}</div>
          </div>
          <div className="flex items-center mt-4 text-sm">
           
            <span className={`${card.trendColor} font-semibold`}>{card.trend}</span>
            <span className="text-gray-500 ml-1">{card.trendText}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
