import axios from 'axios';

const getFlightList = async ({
  flightNo = '',
  stationCodeList = [],
  dateStart,
  dateEnd,
  page = 1,
  perPage = 10,
}: {
  flightNo?: string;
  stationCodeList?: string[];
  dateStart: string;
  dateEnd: string;
  page?: number;
  perPage?: number;
}) => {
  const apiUrl = `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/listdata`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        flightNo,
        stationCodeList,
        dateStart,
        dateEnd,
        page,
        perPage,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // ใส่ Authorization header ถ้าจำเป็น
          // Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch flight list');
  }
};

export default getFlightList;