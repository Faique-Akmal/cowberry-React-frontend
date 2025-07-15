import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Developers", value: 50, color: "#1E40AF" },     // blue-900
  { name: "Marketing", value: 20, color: "#38BDF8" },      // sky-400
  { name: "Finance", value: 20, color: "#F87171" },        // red-400
  { name: "Designing", value: 10, color: "#0EA5E9" },      // cyan-500
];

export default function EmployeeChart() {
  return (
    <div className="h-full bg-white p-6 rounded-xl shadow-md  max-w-4xl mx-auto flex flex-col sm:flex-row gap-6">
      <div className="w-full sm:w-1/2">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Employees by Department
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-1/2 flex flex-col justify-center ">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="text-xl font-bold text-gray-900 w-10">
              {item.value}
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 text-sm">{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
