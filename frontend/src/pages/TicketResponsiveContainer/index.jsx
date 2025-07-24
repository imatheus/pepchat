import React from "react";
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';

import Tickets from "../TicketsCustom"
import TicketAdvanced from "../TicketsAdvanced";

function TicketResponsiveContainer (props) {
    // Para desktop (lg e acima) usar layout completo
    // Para tablet e mobile usar layout simplificado
    if (isWidthUp('lg', props.width)) {
        return <Tickets />;    
    }
    return <TicketAdvanced />
}

export default withWidth()(TicketResponsiveContainer);