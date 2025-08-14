import React, { useEffect, useState } from "react";
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';

import Tickets from "../TicketsCustom"
import TicketAdvanced from "../TicketsAdvanced";
import useSettings from "../../hooks/useSettings";
import { socketConnection } from "../../services/socket";

function TicketResponsiveContainer (props) {
    const { getAll: getAllSettings } = useSettings();
    const [mergeOpenPending, setMergeOpenPending] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const settingList = await getAllSettings();
                const ticketsView = settingList.find(s => s.key === 'ticketsView');
                setMergeOpenPending(ticketsView?.value === 'new');
            } catch (e) {
                // ignore errors, keep default
            }
        }
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketConnection({ companyId });
        socket.on(`company-${companyId}-settings`, (data) => {
            if (data?.setting?.key === 'ticketsView') {
                setMergeOpenPending(data.setting.value === 'new');
            }
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    // Para desktop (lg e acima) usar layout completo
    // Para tablet e mobile usar layout simplificado
    if (isWidthUp('lg', props.width)) {
        return <Tickets mergeOpenPending={mergeOpenPending} />;    
    }
    return <TicketAdvanced mergeOpenPending={mergeOpenPending} />
}

export default withWidth()(TicketResponsiveContainer);