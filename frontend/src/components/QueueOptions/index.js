import React, { useState, useEffect, useCallback, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import Typography from "@material-ui/core/Typography";
import { Button, IconButton, StepContent, TextField, CircularProgress } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import CheckIcon from "@material-ui/icons/Check";
import DoneIcon from "@material-ui/icons/Done";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    //height: 400,
    [theme.breakpoints.down("sm")]: {
      maxHeight: "20vh",
    },
  },
  button: {
    marginRight: theme.spacing(1),
  },
  input: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  addButton: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  savingIndicator: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.primary.main,
    fontSize: '0.875rem',
    marginLeft: theme.spacing(1),
  },
  savedIndicator: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.success.main,
    marginLeft: theme.spacing(1),
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(1),
  },
}));

export function QueueOptionStepper({ queueId, options, updateOptions }) {
  const classes = useStyles();
  const [activeOption, setActiveOption] = useState(-1);
  const saveTimeouts = useRef({});

  // Cleanup dos timeouts quando o componente for desmontado
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleOption = (index) => async () => {
    setActiveOption(index);
    const option = options[index];

    if (option !== undefined && option.id !== undefined) {
      try {
        const { data } = await api.request({
          url: "/queue-options",
          method: "GET",
          params: { queueId, parentId: option.id },
        });
        const optionList = data.map((option) => {
          return {
            ...option,
            children: [],
            edition: false,
            saving: false,
            saved: false,
          };
        });
        option.children = optionList;
        updateOptions();
      } catch (e) {
        toastError(e);
      }
    }
  };

  const handleSave = async (option, showToast = false, keepEditing = true) => {
    try {
      // Marcar como salvando
      option.saving = true;
      option.saved = false;
      updateOptions();

      if (option.id) {
        await api.request({
          url: `/queue-options/${option.id}`,
          method: "PUT",
          data: option,
        });
      } else {
        const { data } = await api.request({
          url: `/queue-options`,
          method: "POST",
          data: option,
        });
        option.id = data.id;
      }
      
      // Marcar como salvo mas manter em edição se especificado
      option.saving = false;
      option.saved = true;
      if (!keepEditing) {
        option.edition = false;
      }
      updateOptions();

      // Não mostrar toast para salvamento automático, apenas o check visual
      // if (showToast) {
      //   toast.success("Opção salva automaticamente!");
      // }

      // Remover indicador de salvo após 2 segundos
      setTimeout(() => {
        option.saved = false;
        updateOptions();
      }, 2000);

    } catch (e) {
      option.saving = false;
      option.saved = false;
      updateOptions();
      toastError(e);
    }
  };

  const handleAutoSave = useCallback((option) => {
    const optionKey = `${option.queueId}-${option.parentId || 'null'}-${option.option}`;
    
    // Limpar timeout anterior se existir
    if (saveTimeouts.current[optionKey]) {
      clearTimeout(saveTimeouts.current[optionKey]);
    }

    // Definir novo timeout para salvamento automático
    saveTimeouts.current[optionKey] = setTimeout(() => {
      if (option.title.trim() || option.message.trim()) {
        handleSave(option, false, true);
      }
    }, 1500); // Salvar após 1.5 segundos de inatividade
  }, []);

  const handleEdition = (index) => {
    options[index].edition = !options[index].edition;
    if (options[index].edition) {
      // Quando entra em edição, garantir que tem os campos de controle
      options[index].saving = false;
      options[index].saved = false;
    }
    updateOptions();
  };

  const handleFinishEditing = async (option) => {
    // Salvar e sair do modo de edição
    if (option.title.trim() || option.message.trim()) {
      await handleSave(option, false, false);
    } else {
      option.edition = false;
      updateOptions();
    }
  };

  const handleDeleteOption = async (index) => {
    const option = options[index];
    if (option !== undefined && option.id !== undefined) {
      try {
        await api.request({
          url: `/queue-options/${option.id}`,
          method: "DELETE",
        });
      } catch (e) {
        toastError(e);
      }
    }
    options.splice(index, 1);
    options.forEach(async (option, order) => {
      option.option = order + 1;
      await handleSave(option, false, true);
    });
    updateOptions();
  };

  const handleOptionChangeTitle = (event, index) => {
    options[index].title = event.target.value;
    updateOptions();
    handleAutoSave(options[index]);
  };

  const handleOptionChangeMessage = (event, index) => {
    options[index].message = event.target.value;
    updateOptions();
    handleAutoSave(options[index]);
  };

  const renderTitle = (index) => {
    const option = options[index];
    if (option.edition) {
      return (
        <div className={classes.inputContainer}>
          <TextField
            value={option.title}
            onChange={(event) => handleOptionChangeTitle(event, index)}
            size="small"
            className={classes.input}
            placeholder="Título da opção"
            onBlur={() => {
              // Salvar imediatamente quando sair do campo se houver conteúdo, mas manter em edição
              if (option.title.trim() || option.message.trim()) {
                handleSave(option, false, true);
              }
            }}
          />
          {option.saving && (
            <div className={classes.savingIndicator}>
              <CircularProgress size={16} />
              <span style={{ marginLeft: 4 }}>Salvando...</span>
            </div>
          )}
          {option.saved && (
            <div className={classes.savedIndicator}>
              <CheckIcon fontSize="small" />
            </div>
          )}
          <div className={classes.actionButtons}>
            <IconButton
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => handleFinishEditing(options[index])}
              title="Concluir edição"
            >
              <DoneIcon />
            </IconButton>
            <IconButton
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => handleDeleteOption(index)}
              title="Excluir opção"
            >
              <DeleteOutlineIcon />
            </IconButton>
          </div>
        </div>
      );
    }
    return (
      <>
        <Typography>
          {option.title !== "" ? option.title : "Título não definido"}
          <IconButton
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={() => handleEdition(index)}
          >
            <EditIcon />
          </IconButton>
        </Typography>
      </>
    );
  };

  const renderMessage = (index) => {
    const option = options[index];
    if (option.edition) {
      return (
        <div className={classes.inputContainer}>
          <TextField
            style={{ width: "100%" }}
            multiline
            rows={3}
            value={option.message}
            onChange={(event) => handleOptionChangeMessage(event, index)}
            size="small"
            className={classes.input}
            placeholder="Digite o texto da opção"
            onBlur={() => {
              // Salvar imediatamente quando sair do campo se houver conteúdo, mas manter em edição
              if (option.title.trim() || option.message.trim()) {
                handleSave(option, false, true);
              }
            }}
          />
          {option.saved && (
            <div className={classes.savedIndicator}>
              <CheckIcon fontSize="small" />
            </div>
          )}
        </div>
      );
    }
    return (
      <>
        <Typography onClick={() => handleEdition(index)}>
          {option.message || "Clique para adicionar mensagem"}
        </Typography>
      </>
    );
  };

  const handleAddOption = (index) => {
    const optionNumber = options[index].children.length + 1;
    options[index].children.push({
      title: "",
      message: "",
      edition: true, // Iniciar em modo de edição
      option: optionNumber,
      queueId,
      parentId: options[index].id,
      children: [],
      saving: false,
      saved: false,
    });
    updateOptions();
  };

  const renderStep = (option, index) => {
    return (
      <Step key={index}>
        <StepLabel style={{ cursor: "pointer" }} onClick={handleOption(index)}>
          {renderTitle(index)}
        </StepLabel>
        <StepContent>
          {renderMessage(index)}

          {option.id !== undefined && (
            <>
              <Button
                color="primary"
                size="small"
                onClick={() => handleAddOption(index)}
                startIcon={<AddIcon />}
                variant="outlined"
                className={classes.addButton}
              >
                Adicionar
              </Button>
            </>
          )}
          <QueueOptionStepper
            queueId={queueId}
            options={option.children}
            updateOptions={updateOptions}
          />
        </StepContent>
      </Step>
    );
  };

  const renderStepper = () => {
    return (
      <Stepper
        style={{ marginBottom: 0, paddingBottom: 0 }}
        nonLinear
        activeStep={activeOption}
        orientation="vertical"
      >
        {options.map((option, index) => renderStep(option, index))}
      </Stepper>
    );
  };

  return renderStepper();
}

export function QueueOptions({ queueId }) {
  const classes = useStyles();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (queueId) {
      const fetchOptions = async () => {
        try {
          const { data } = await api.request({
            url: "/queue-options",
            method: "GET",
            params: { queueId, parentId: -1 },
          });
          const optionList = data.map((option) => {
            return {
              ...option,
              children: [],
              edition: false,
              saving: false,
              saved: false,
            };
          });
          setOptions(optionList);
        } catch (e) {
          toastError(e);
        }
      };
      fetchOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueId]);

  const renderStepper = () => {
    if (options.length > 0) {
      return (
        <QueueOptionStepper
          queueId={queueId}
          updateOptions={updateOptions}
          options={options}
        />
      );
    }
  };

  const updateOptions = () => {
    setOptions([...options]);
  };

  const addOption = () => {
    const newOption = {
      title: "",
      message: "",
      edition: true, // Iniciar em modo de edição
      option: options.length + 1,
      queueId,
      parentId: null,
      children: [],
      saving: false,
      saved: false,
    };
    setOptions([...options, newOption]);
  };

  return (
    <div className={classes.root}>
      <br />
      <Typography>
        Opções
        <Button
          color="primary"
          size="small"
          onClick={addOption}
          startIcon={<AddIcon />}
          style={{ marginLeft: 10 }}
          variant="outlined"
        >
          Adicionar
        </Button>
      </Typography>
      {renderStepper()}
    </div>
  );
}