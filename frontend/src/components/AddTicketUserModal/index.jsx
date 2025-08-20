import React, { useEffect, useState } from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Avatar from "@material-ui/core/Avatar";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const filterOptions = createFilterOptions({ trim: true });

const AddTicketUserModal = ({ open, onClose, ticket }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [linkedUsers, setLinkedUsers] = useState([]);

  // Inicializa a lista de vinculados sempre que abrir o modal ou o ticket mudar
  useEffect(() => {
    const enrichUsers = async (users) => {
      try {
        const detailed = await Promise.all(users.map(async (u) => {
          try {
            const { data } = await api.get(`/users/${u.id}`);
            return { ...u, profileImage: data.profileImage };
          } catch (e) {
            return u; // fallback sem imagem
          }
        }));
        setLinkedUsers(detailed);
      } catch (e) {
        setLinkedUsers(users);
      }
    };

    if (open) {
      const users = Array.isArray(ticket?.users) ? ticket.users : [];
      if (users.length > 0) {
        enrichUsers(users);
      } else {
        setLinkedUsers([]);
      }
    }
  }, [open, ticket]);

  useEffect(() => {
    if (!open || searchParam.length < 2) {
      setLoading(false);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", { params: { searchParam } });
          setOptions(data.users);
        } catch (err) {
          toastError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [open, searchParam]);

  const handleClose = () => {
    setSearchParam("");
    setSelectedUser(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/tickets/${ticket.id}/link`, { userId: selectedUser.id });
      // Buscar detalhes para obter profileImage e alinhar visual
      try {
        const { data } = await api.get(`/users/${selectedUser.id}`);
        const userWithImage = { ...selectedUser, profileImage: data.profileImage };
        setLinkedUsers(prev => {
          const exists = prev.some(u => u.id === userWithImage.id);
          return exists ? prev : [...prev, userWithImage];
        });
      } catch (e) {
        // fallback sem imagem
        setLinkedUsers(prev => {
          const exists = prev.some(u => u.id === selectedUser.id);
          return exists ? prev : [...prev, selectedUser];
        });
      }
      setSelectedUser(null);
      setSearchParam("");
    } catch (err) {
      toastError(err);
    }
  };

  const handleUnlink = async (userId) => {
    try {
      await api.delete(`/tickets/${ticket.id}/link/${userId}`);
      setLinkedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Vincular/Desvincular atendente</DialogTitle>
      <DialogContent dividers>
        {/* Área de atendentes já vinculados com "X" para desvincular */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Atendentes vinculados
          </Typography>
          <Box display="flex" flexWrap="wrap" alignItems="center" style={{ gap: 8 }}>
            {linkedUsers.length === 0 && (
              <Typography variant="body2" color="textSecondary">Nenhum atendente vinculado.</Typography>
            )}
            {linkedUsers.map(u => (
              <Chip 
                key={u.id}
                size="small"
                label={u.name}
                avatar={<Avatar src={u.profileImage || undefined}>{!u.profileImage && u.name?.[0]}</Avatar>}
                onDelete={() => handleUnlink(u.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Busca e seleção para vincular novo atendente */}
        <Autocomplete
          style={{ width: "100%" }}
          getOptionLabel={(option) => `${option.name}`}
          onChange={(e, newValue) => setSelectedUser(newValue)}
          options={options}
          filterOptions={filterOptions}
          freeSolo
          autoHighlight
          noOptionsText="Nenhum usuário encontrado"
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar atendente"
              variant="outlined"
              autoFocus
              onChange={(e) => setSearchParam(e.target.value)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Fechar
        </Button>
        <Button onClick={handleConfirm} color="primary" variant="contained" disabled={!selectedUser}>
          Vincular
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTicketUserModal;
