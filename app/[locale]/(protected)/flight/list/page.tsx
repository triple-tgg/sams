"use client";
import React from 'react'
import ListTable from './components/list-table'
import getFlightList from '@/lib/api/fleght/getFlightList';

import { useEffect, useState } from 'react';
import { FlightItem, Pagination } from '@/lib/api/fleght/filghtlist.interface';

const ProjectList = () => {
    const [flightList, setFlightList] = useState<FlightItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>({
        page: 1,
        perPage: 20,
        total: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            const data = await getFlightList({
                flightNo: '',
                stationCodeList: [],
                dateStart: '2025-08-19',
                dateEnd: '2025-08-20',
                page: pagination?.page,
                perPage: pagination?.perPage,
            });
            setFlightList(data.responseData);
            console.log("flightList", data);
        };
        fetchData();
    }, [pagination]);

    return (
        <div>
            <ListTable projects={flightList} />
        </div>
    );
}

export default ProjectList