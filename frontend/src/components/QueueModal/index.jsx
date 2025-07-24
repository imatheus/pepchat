import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { generateRandomColor } from "../../utils/colorGenerator";
import {
  Paper,
} from "@material-ui/core";
import { QueueOptions } from "../QueueOptions";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

const QueueSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  color: Yup.string().min(3, "Too Short!").max(9, "Too Long!").required(),
  greetingMessage: Yup.string(),
});

const QueueModal = ({ open, onClose, queueId }) => {
  const classes = useStyles();

  const initialState = {
    name: "",
    color: queueId ? "" : generateRandomColor(), // Auto-generate color for new queues
    greetingMessage: "",
    outOfHoursMessage: "",
  };

  const [queue, setQueue] = useState(initialState);
  const greetingRef = useRef();

  useEffect(() => {
    (async () => {
      if (!queueId) {
        // For new queues, set a random color
        setQueue({
          name: "",
          color: generateRandomColor(),
          greetingMessage: "",
          outOfHoursMessage: "",
        });
        return;
      }
      try {
        const { data } = await api.get(`/queue/${queueId}`);
        setQueue((prevState) => {
          return { ...prevState, ...data };
        });
      } catch (err) {
        toastError(err);
      }
    })();

    return () => {
      setQueue({
        name: "",
        color: "",
        greetingMessage: "",
        outOfHoursMessage: "",
      });
    };
  }, [queueId, open]);

  const handleClose = () => {
    onClose();
    // Generate new color for next new queue
    const newInitialState = {
      name: "",
      color: generateRandomColor(),
      greetingMessage: "",
      outOfHoursMessage: "",
    };
    setQueue(newInitialState);
  };

  const handleSaveQueue = async (values) => {
    try {
      if (queueId) {
        await api.put(`/queue/${queueId}`, values);
      } else {
        await api.post("/queue", values);
      }
      toast.success("Queue saved successfully");
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className={classes.root}>
      <Dialog
        maxWidth="md"
        fullWidth={true}
        open={open}
        onClose={handleClose}
        scroll="paper"
      >
        <DialogTitle>
          {queueId
            ? `${i18n.t("queueModal.title.edit")}`
            : `${i18n.t("queueModal.title.add")}`}
        </DialogTitle>
        <Paper>
          <Formik
            initialValues={queue}
            enableReinitialize={true}
            validationSchema={QueueSchema}
            onSubmit={(values, actions) => {
              setTimeout(() => {
                handleSaveQueue(values);
                actions.setSubmitting(false);
              }, 400);
            }}
          >
            {({ touched, errors, isSubmitting, values }) => (
              <Form>
                <DialogContent dividers>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.name")}
                    autoFocus
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
                    margin="dense"
                    className={classes.textField}
                  />
                  {/* Campo de cor removido - cor será gerada automaticamente */}
                  <div style={{ marginTop: 5 }}>
                        <Field
                          as={TextField}
                          label={i18n.t("queueModal.form.greetingMessage")}
                          type="greetingMessage"
                          multiline
                          inputRef={greetingRef}
                          rows={5}
                          fullWidth
                          name="greetingMessage"
                          error={
                            touched.greetingMessage &&
                            Boolean(errors.greetingMessage)
                          }
                          helperText={
                            touched.greetingMessage && errors.greetingMessage
                          }
                          variant="outlined"
                          margin="dense"
                        />
                  </div>
                  <QueueOptions queueId={queueId} />
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleClose}
                    color="secondary"
                    disabled={isSubmitting}
                    variant="outlined"
                  >
                    {i18n.t("queueModal.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                    variant="contained"
                    className={classes.btnWrapper}
                  >
                    {queueId
                      ? `${i18n.t("queueModal.buttons.okEdit")}`
                      : `${i18n.t("queueModal.buttons.okAdd")}`}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Paper>
      </Dialog>
    </div>
  );
};

export default QueueModal;