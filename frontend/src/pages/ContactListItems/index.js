import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
} from "react";

import { toast } from "react-toastify";
import { useParams, useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import ContactsIcon from "@material-ui/icons/Contacts";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import DeleteSweepIcon from "@material-ui/icons/DeleteSweep";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactListItemModal from "../../components/ContactListItemModal";
import ConfirmationModal from "../../components/ConfirmationModal/";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import useContactLists from "../../hooks/useContactLists";
import { 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  CircularProgress,
  Typography,
  Menu,
  MenuItem,
  Toolbar,
  Chip
} from "@material-ui/core";

import planilhaExemplo from "../../assets/planilha.xlsx";
import { socketConnection } from "../../services/socket";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "DELETE_MULTIPLE_CONTACTS") {
    const contactIds = action.payload;
    return state.filter(contact => !contactIds.includes(contact.id));
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  bulkActionsToolbar: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1, 2),
    borderRadius: theme.spacing(1),
    margin: theme.spacing(1, 0),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

const ContactListItems = () => {
  const classes = useStyles();

  const { user } = useContext(AuthContext);
  const { contactListId } = useParams();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactListItemModalOpen, setContactListItemModalOpen] =
    useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [contactList, setContactList] = useState({});
  const fileUploadRef = useRef(null);
  const [importContactsModalOpen, setImportContactsModalOpen] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [importMenuAnchor, setImportMenuAnchor] = useState(null);
  
  // Estados para exclusão em massa
  const [selectedContactsForDeletion, setSelectedContactsForDeletion] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { findById: findContactList } = useContactLists();

  useEffect(() => {
    findContactList(contactListId).then((data) => {
      setContactList(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactListId]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    // Limpar seleções ao mudar busca
    setSelectedContactsForDeletion([]);
    setSelectAllChecked(false);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get(`contact-list-items`, {
            params: { searchParam, pageNumber, contactListId },
          });
          dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, contactListId]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-ContactListItem`, (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.record });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.id });
      }

      if (data.action === "reload") {
        dispatch({ type: "LOAD_CONTACTS", payload: data.records });
      }
    });

    socket.on(
      `company-${companyId}-ContactListItem-${contactListId}`,
      (data) => {
        if (data.action === "reload") {
          dispatch({ type: "LOAD_CONTACTS", payload: data.records });
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [contactListId]);

  // Atualizar estado do "Selecionar Todos" baseado nas seleções individuais
  useEffect(() => {
    if (contacts.length > 0) {
      const allSelected = contacts.every(contact => 
        selectedContactsForDeletion.includes(contact.id)
      );
      setSelectAllChecked(allSelected);
    }
  }, [selectedContactsForDeletion, contacts]);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactListItemModal = () => {
    setSelectedContactId(null);
    setContactListItemModalOpen(true);
  };

  const handleCloseContactListItemModal = () => {
    setSelectedContactId(null);
    setContactListItemModalOpen(false);
  };

  const hadleEditContact = (contactId) => {
    setSelectedContactId(contactId);
    setContactListItemModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/contact-list-items/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
  };

  // Funções para exclusão em massa
  const handleSelectContact = (contactId) => {
    setSelectedContactsForDeletion(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAllContacts = () => {
    if (selectAllChecked) {
      setSelectedContactsForDeletion([]);
    } else {
      setSelectedContactsForDeletion(contacts.map(contact => contact.id));
    }
  };

  const handleOpenBulkDeleteModal = () => {
    if (selectedContactsForDeletion.length === 0) {
      toast.warning("Selecione pelo menos um contato para excluir");
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const handleCloseBulkDeleteModal = () => {
    setBulkDeleteModalOpen(false);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      // Excluir contatos em lotes para evitar sobrecarga
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedContactsForDeletion.length; i += batchSize) {
        batches.push(selectedContactsForDeletion.slice(i, i + batchSize));
      }

      let deletedCount = 0;
      let errorCount = 0;

      for (const batch of batches) {
        try {
          await Promise.all(
            batch.map(contactId => api.delete(`/contact-list-items/${contactId}`))
          );
          deletedCount += batch.length;
        } catch (err) {
          console.error("Erro ao excluir lote:", err);
          errorCount += batch.length;
        }
      }

      // Atualizar estado local
      dispatch({ 
        type: "DELETE_MULTIPLE_CONTACTS", 
        payload: selectedContactsForDeletion 
      });

      // Limpar seleções
      setSelectedContactsForDeletion([]);
      setSelectAllChecked(false);

      // Mostrar resultado
      if (deletedCount > 0) {
        toast.success(`${deletedCount} contatos excluídos com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`Erro ao excluir ${errorCount} contatos`);
      }

      setBulkDeleteModalOpen(false);
    } catch (err) {
      toastError(err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedContactsForDeletion([]);
    setSelectAllChecked(false);
  };

  const handleImportContacts = async () => {
    try {
      const formData = new FormData();
      formData.append("file", fileUploadRef.current.files[0]);
      const response = await api.request({
        url: `contact-lists/${contactListId}/upload`,
        method: "POST",
        data: formData,
      });

      // Mostrar informações detalhadas da importação
      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        
        // Mostrar informações adicionais se houver contatos descartados
        if (data.data.discarded > 0) {
          toast.info(`${data.data.discarded} contatos foram descartados (números inválidos ou duplicados)`);
        }
        
        // Avisar se o limite foi excedido
        if (data.data.limitExceeded) {
          toast.warning(`Limite de contatos atingido! Seu plano permite até ${data.data.maxContactsAllowed} contatos por campanha.`);
        }
        
        // Mostrar números inválidos se houver poucos
        if (data.data.invalidNumbers && data.data.invalidNumbers.length > 0 && data.data.invalidNumbers.length <= 5) {
          toast.error(`Números inválidos descartados: ${data.data.invalidNumbers.join(', ')}`);
        } else if (data.data.invalidNumbers && data.data.invalidNumbers.length > 5) {
          toast.error(`${data.data.invalidNumbers.length} números inválidos foram descartados`);
        }
      }
    } catch (err) {
      toastError(err);
    }
  };

  const fetchAvailableContacts = async () => {
    setLoadingContacts(true);
    try {
      const { data } = await api.get("/contacts", {
        params: { pageNumber: 1, searchParam: "" }
      });
      setAvailableContacts(data.contacts || []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleOpenImportContactsModal = () => {
    setImportContactsModalOpen(true);
    setSelectedContacts([]);
    fetchAvailableContacts();
  };

  const handleCloseImportContactsModal = () => {
    setImportContactsModalOpen(false);
    setAvailableContacts([]);
    setSelectedContacts([]);
  };

  const handleSelectContactForImport = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAllContactsForImport = () => {
    if (selectedContacts.length === availableContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(availableContacts.map(contact => contact.id));
    }
  };

  const handleImportSelectedContacts = async () => {
    if (selectedContacts.length === 0) {
      toast.warning("Selecione pelo menos um contato para importar");
      return;
    }

    try {
      const { data } = await api.post(`/contact-list-items/${contactListId}/import-contacts`, {
        contactIds: selectedContacts
      });
      
      toast.success(`${data.result.imported} contatos importados com sucesso!`);
      if (data.result.skipped > 0) {
        toast.info(`${data.result.skipped} contatos já existiam na lista`);
      }
      if (data.result.errors > 0) {
        toast.error(`${data.result.errors} contatos falharam na importação`);
      }
      
      handleCloseImportContactsModal();
      // Recarregar a lista
      setPageNumber(1);
      setSearchParam("");
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const handleImportMenuClick = (event) => {
    setImportMenuAnchor(event.currentTarget);
  };

  const handleImportMenuClose = () => {
    setImportMenuAnchor(null);
  };

  const handleImportFromSpreadsheet = () => {
    handleImportMenuClose();
    fileUploadRef.current.value = null;
    fileUploadRef.current.click();
  };

  const handleImportFromContacts = () => {
    handleImportMenuClose();
    handleOpenImportContactsModal();
  };

  const goToContactLists = () => {
    history.push("/contact-lists");
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <ContactListItemModal
        open={contactListItemModalOpen}
        onClose={handleCloseContactListItemModal}
        aria-labelledby="form-dialog-title"
        contactId={selectedContactId}
      ></ContactListItemModal>
      
      <Dialog 
        open={importContactsModalOpen} 
        onClose={handleCloseImportContactsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Importar Contatos do Sistema
          <Typography variant="body2" color="textSecondary">
            Selecione os contatos que deseja importar para esta lista
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingContacts ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <CircularProgress />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '10px' }}>
                <Button
                  onClick={handleSelectAllContactsForImport}
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  {selectedContacts.length === availableContacts.length ? 
                    'Desmarcar Todos' : 'Selecionar Todos'
                  }
                </Button>
                <Typography variant="body2" style={{ marginTop: '5px' }}>
                  {selectedContacts.length} de {availableContacts.length} contatos selecionados
                </Typography>
              </div>
              
              <List style={{ maxHeight: '400px', overflow: 'auto' }}>
                {availableContacts.map((contact) => (
                  <ListItem 
                    key={contact.id} 
                    button 
                    onClick={() => handleSelectContactForImport(contact.id)}
                  >
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelectContactForImport(contact.id)}
                    />
                    <ListItemText
                      primary={contact.name}
                      secondary={`${contact.number} - ${contact.email || 'Sem email'}`}
                    />
                  </ListItem>
                ))}
                {availableContacts.length === 0 && !loadingContacts && (
                  <Typography variant="body2" color="textSecondary" style={{ padding: '20px', textAlign: 'center' }}>
                    Nenhum contato encontrado no sistema
                  </Typography>
                )}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportContactsModal} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleImportSelectedContacts} 
            color="primary" 
            variant="contained"
            disabled={selectedContacts.length === 0 || loadingContacts}
          >
            Importar {selectedContacts.length} Contatos
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmação para exclusão em massa */}
      <ConfirmationModal
        title={
          selectedContactsForDeletion.length > 0
            ? `Excluir ${selectedContactsForDeletion.length} contatos selecionados?`
            : deletingContact
            ? `${i18n.t("contactListItems.confirmationModal.deleteTitle")} ${
                deletingContact.name
              }?`
            : `${i18n.t("contactListItems.confirmationModal.importTitlte")}`
        }
        open={bulkDeleteModalOpen || confirmOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          if (selectedContactsForDeletion.length > 0) {
            handleBulkDelete();
          } else if (deletingContact) {
            handleDeleteContact(deletingContact.id);
          } else {
            handleImportContacts();
          }
        }}
        loading={bulkDeleting}
      >
        {selectedContactsForDeletion.length > 0 ? (
          <>
            <Typography variant="body1" gutterBottom>
              Esta ação não pode ser revertida. Todos os {selectedContactsForDeletion.length} contatos selecionados serão excluídos permanentemente.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Contatos que serão excluídos:
            </Typography>
            <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
              {contacts
                .filter(contact => selectedContactsForDeletion.includes(contact.id))
                .map(contact => (
                  <Chip
                    key={contact.id}
                    label={contact.name}
                    size="small"
                    style={{ margin: '2px' }}
                  />
                ))
              }
            </div>
          </>
        ) : deletingContact ? (
          `${i18n.t("contactListItems.confirmationModal.deleteMessage")}`
        ) : (
          <>
            {i18n.t("contactListItems.confirmationModal.importMessage")}
            <a href={planilhaExemplo} download="planilha.xlsx">
              Clique aqui para baixar planilha exemplo.
            </a>
          </>
        )}
      </ConfirmationModal>

      <MainHeader>
        <Grid style={{ width: "99.6%" }} container>
          <Grid xs={12} sm={5} item>
            <Title>{contactList.name}</Title>
          </Grid>
          <Grid xs={12} sm={7} item>
            <Grid spacing={2} container>
              <Grid xs={12} sm={6} item>
                <TextField
                  fullWidth
                  placeholder={i18n.t("contactListItems.searchPlaceholder")}
                  type="search"
                  value={searchParam}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon style={{ color: "gray" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid xs={4} sm={2} item>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={goToContactLists}
                >
                  {i18n.t("contactListItems.buttons.lists")}
                </Button>
              </Grid>
              <Grid xs={4} sm={2} item>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleImportMenuClick}
                  endIcon={<ArrowDropDownIcon />}
                >
                  {i18n.t("contactListItems.buttons.import")}
                </Button>
                <Menu
                  anchorEl={importMenuAnchor}
                  open={Boolean(importMenuAnchor)}
                  onClose={handleImportMenuClose}
                >
                  <MenuItem onClick={handleImportFromContacts}>
                    <ContactsIcon style={{ marginRight: 8, color: '#4caf50' }} />
                    Meus contatos
                  </MenuItem>
                  <MenuItem onClick={handleImportFromSpreadsheet}>
                    <CloudUploadIcon style={{ marginRight: 8, color: '#2e7d32' }} />
                    Planilha
                  </MenuItem>
                </Menu>
              </Grid>
              <Grid xs={4} sm={2} item>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleOpenContactListItemModal}
                >
                  {i18n.t("contactListItems.buttons.add")}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MainHeader>

      {/* Barra de ações em massa */}
      {selectedContactsForDeletion.length > 0 && (
        <div className={classes.bulkActionsToolbar}>
          <div className={classes.selectedInfo}>
            <Typography variant="body1">
              {selectedContactsForDeletion.length} contatos selecionados
            </Typography>
          </div>
          <div>
            <Button
              variant="outlined"
              color="inherit"
              onClick={clearSelection}
              style={{ marginRight: 8 }}
            >
              Limpar Seleção
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DeleteSweepIcon />}
              onClick={handleOpenBulkDeleteModal}
            >
              Excluir Selecionados
            </Button>
          </div>
        </div>
      )}

      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <>
          <input
            style={{ display: "none" }}
            id="upload"
            name="file"
            type="file"
            accept=".xls,.xlsx"
            onChange={() => {
              setConfirmOpen(true);
            }}
            ref={fileUploadRef}
          />
        </>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedContactsForDeletion.length > 0 && 
                    selectedContactsForDeletion.length < contacts.length
                  }
                  checked={selectAllChecked && contacts.length > 0}
                  onChange={handleSelectAllContacts}
                  disabled={contacts.length === 0}
                />
              </TableCell>
              <TableCell>{i18n.t("contactListItems.table.name")}</TableCell>
              <TableCell align="center">
                {i18n.t("contactListItems.table.number")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("contactListItems.table.email")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("contactListItems.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {contacts.map((contact) => (
                <TableRow 
                  key={contact.id}
                  selected={selectedContactsForDeletion.includes(contact.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedContactsForDeletion.includes(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell align="center">{contact.number}</TableCell>
                  <TableCell align="center">{contact.email}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => hadleEditContact(contact.id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setConfirmOpen(true);
                            setDeletingContact(contact);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={5} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default ContactListItems;