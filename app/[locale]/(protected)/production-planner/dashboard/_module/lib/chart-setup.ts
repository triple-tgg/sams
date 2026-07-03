import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';

// Registered once; every chart component imports this module first so
// repeated imports across the tree are safe (module cache dedupes it).
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

export { ChartJS };
export type { ChartOptions };
