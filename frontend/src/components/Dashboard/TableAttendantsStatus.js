import React from "react";

import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Skeleton from "@material-ui/lab/Skeleton";
import Avatar from "@material-ui/core/Avatar";
import Box from "@material-ui/core/Box";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import moment from 'moment';

import Rating from '@material-ui/lab/Rating';
import useUserStatus from "../../hooks/useUserStatus";

const useStyles = makeStyles(theme => ({
	on: {
		color: green[600],
		fontSize: '20px'
	},
	off: {
		color: red[600],
		fontSize: '20px'
	},
    pointer: {
        cursor: "pointer"
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1)
    },
    avatar: {
        width: theme.spacing(4),
        height: theme.spacing(4),
        fontSize: '0.875rem'
    }
}));

export function RatingBox ({ rating }) {
    // Handle null, undefined, or invalid rating values
    let ratingValue = 0;
    
    if (rating !== null && rating !== undefined && !isNaN(rating)) {
        ratingValue = Math.max(0, Math.min(3, Math.trunc(Number(rating))));
    }
    
    return <Rating
        value={ratingValue}
        max={3}
        readOnly
        size="small"
    />
}

export default function TableAttendantsStatus(props) {
    const { loading, attendants } = props
	const classes = useStyles();
    const { getUserStatus } = useUserStatus();

    function renderList () {
        if (!attendants || attendants.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} align="center" style={{ padding: '20px', color: '#666' }}>
                        Nenhum atendente encontrado para o período selecionado
                    </TableCell>
                </TableRow>
            );
        }

        return attendants.map((a, k) => {
            // Use real-time status from socket, fallback to initial data
            const isOnline = getUserStatus(a.id) !== undefined ? getUserStatus(a.id) : a.online;
            
            // Generate initials from name for avatar fallback
            const getInitials = (name) => {
                if (!name) return '?';
                return name
                    .split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
            };
            
            return (
                <TableRow key={k}>
                    <TableCell>
                        <Box className={classes.userInfo}>
                            <Avatar 
                                className={classes.avatar}
                                src={a.profileImage}
                                alt={a.name}
                            >
                                {getInitials(a.name)}
                            </Avatar>
                            {a.name || 'Nome não disponível'}
                        </Box>
                    </TableCell>
                    <TableCell align="center" title="1 - Insatisfeito, 2 - Satisfeito, 3 - Muito Satisfeito" className={classes.pointer}>
                        <RatingBox rating={a.rating} />
                    </TableCell>
                    <TableCell align="center">{formatTime(a.avgSupportTime || 0)}</TableCell>
                    <TableCell align="center">
                        { isOnline ?
                            <CheckCircleIcon className={classes.on} />
                            : <ErrorIcon className={classes.off} />
                        }
                    </TableCell>
                </TableRow>
            );
        });
    }

	function formatTime(minutes){
		return moment().startOf('day').add(minutes, 'minutes').format('HH[h] mm[m]');
	}

    return ( !loading ?
        <TableContainer component={Paper} style={{ borderRadius: '12px' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell align="center">Avaliações</TableCell>
                        <TableCell align="center">T.M. de Atendimento</TableCell>
                        <TableCell align="center">Status (Atual)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { renderList() }
                </TableBody>
            </Table>
        </TableContainer>
        : <Skeleton variant="rect" height={150} />
    )
}