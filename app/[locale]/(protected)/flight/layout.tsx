import { Metadata } from "next";
import FlightListProvider from "./List.provider";
import dayjs from "dayjs";
export const metadata: Metadata = {
  title: 'Projects',
  description: 'Projects Page'
}
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <FlightListProvider
      initialPagination={{ page: 1, perPage: 20 }}
      initialFilters={{
        flightNo: "",
        stationCode: "",
        dateStart: dayjs().format("YYYY-MM-DD"), // Today's date
        dateEnd: dayjs().format("YYYY-MM-DD"), // Today's date
      }}
    >
      {children}
    </FlightListProvider>

  );
};

export default Layout;