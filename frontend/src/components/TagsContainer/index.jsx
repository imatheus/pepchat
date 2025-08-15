import { Chip, Paper, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useRef, useState } from "react";
import { isArray, isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { darkenColor, getContrastColor } from "../../utils/colorGenerator";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  tagInputRoot: {
    minWidth: 300,
    "& .MuiOutlinedInput-root": {
      borderRadius: 50,
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
}));

export function TagsContainer ({ ticket }) {

    const [tags, setTags] = useState([]);
    const [selecteds, setSelecteds] = useState([]);
    const isMounted = useRef(true);
    const classes = useStyles();

    useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    useEffect(() => {
        if (isMounted.current) {
            loadTags().then(() => {
                if (Array.isArray(ticket.tags)) {
                    setSelecteds(ticket.tags);
                } else {
                    setSelecteds([]);
                }
            });
        }
    }, [ticket]);

    const createTag = async (data) => {
        try {
            const { data: responseData } = await api.post(`/tags`, data);
            return responseData;
        } catch (err) {
            toastError(err);
        }
    }

    const loadTags = async () => {
        try {
            const { data } = await api.get(`/tags/list`);
            setTags(data);
        } catch (err) {
            toastError(err);
        }
    }

    const syncTags = async (data) => {
        try {
            const { data: responseData } = await api.post(`/tags/sync`, data);
            return responseData;
        } catch (err) {
            toastError(err);
        }
    }

    const onChange = async (value, reason) => {
        let optionsChanged = []
        if (reason === 'create-option') {
            if (isArray(value)) {
                for (let item of value) {
                    if (isString(item)) {
                        const newTag = await createTag({ name: item })
                        optionsChanged.push(newTag);
                    } else {
                        optionsChanged.push(item);
                    }
                }
            }
            await loadTags();
        } else {
            optionsChanged = value || [];
        }
        // Remover duplicatas por id (ou name se id ausente)
        const seen = new Set();
        const dedup = [];
        for (const t of optionsChanged) {
            const key = t?.id != null ? `id:${t.id}` : `name:${String(t?.name || t).toLowerCase()}`;
            if (!seen.has(key)) {
                seen.add(key);
                dedup.push(t);
            }
        }
        setSelecteds(dedup);
        await syncTags({ ticketId: ticket.id, tags: dedup });
    }

    return (
        <div style={{padding: '8px 0', position: 'relative', zIndex: 1}}>
            <Autocomplete
                multiple
                size="small"
                options={tags}
                value={selecteds}
                freeSolo
                filterSelectedOptions
                disableCloseOnSelect
                getOptionSelected={(option, value) => option?.id === value?.id}
                onChange={(e, v, r) => onChange(v, r)}
                getOptionLabel={(option) => option.name}
                renderOption={(option) => {
                    const bg = darkenColor(option.color || '#eee', 0.2);
                    const fg = getContrastColor(bg);
                    return (
                        <span
                            style={{
                                backgroundColor: bg,
                                color: fg,
                                border: `1px solid ${darkenColor(bg, 0.1)}`,
                                padding: '2px 10px',
                                borderRadius: 100,
                                fontSize: 12,
                                display: 'inline-block'
                            }}
                        >
                            {option.name}
                        </span>
                    );
                }}
                renderTags={(value, getTagProps) => {
                    return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {value.map((option, index) => {
                                const backgroundColor = darkenColor(option.color || '#eee', 0.2);
                                const textColor = getContrastColor(backgroundColor);
                                return (
                                    <Chip
                                        variant="outlined"
                                        style={{
                                            backgroundColor: backgroundColor,
                                            color: textColor,
                                            border: `1px solid ${darkenColor(backgroundColor, 0.1)}`,
                                            margin: 0,
                                            borderRadius:"100px"
                                        }}
                                        label={option.name}
                                        {...getTagProps({ index })}
                                        size="small"
                                    />
                                );
                            })}
                        </div>
                    );
                }}
                renderInput={(params) => (
                    <TextField 
                        {...params} 
                        variant="outlined" 
                        placeholder="Tags"
                        className={classes.tagInputRoot}
                        style={{ minWidth: '500px' }}
                    />
                )}
                PaperComponent={({ children }) => (
                    <Paper style={{width: 400, marginLeft: 12, zIndex: 9999, position: 'relative'}}>
                        {children}
                    </Paper>
                )}
                ListboxProps={{
                    style: {
                        zIndex: 9999,
                        position: 'relative'
                    }
                }}
            />
        </div>
    )
}