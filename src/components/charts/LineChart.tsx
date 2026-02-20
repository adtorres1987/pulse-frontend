import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface LineChartProps {
  labels: string[]
  datasets: ChartData<'line'>['datasets']
  title?: string
}

const options: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: '' },
  },
}

export function LineChart({ labels, datasets, title }: LineChartProps) {
  const data: ChartData<'line'> = { labels, datasets }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {title && <h3 className="text-sm font-semibold text-gray-500 mb-3">{title}</h3>}
      <Line data={data} options={{ ...options, plugins: { ...options.plugins, title: { display: !!title, text: title } } }} />
    </div>
  )
}
