import { Chip, Paper, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useRef, useState } from "react";
import { isArray, isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { darkenColor, getContrastColor } from "../../utils/colorGenerator";

export function TagsContainer ({ ticket }) {

    const [tags, setTags] = useState([]);
    const [selecteds, setSelecteds] = useState([]);
    const isMounted = useRef(true);

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
            optionsChanged = value;
        }
        setSelecteds(optionsChanged);
        await syncTags({ ticketId: ticket.id, tags: optionsChanged });
    }

    return (
        <Paper style={{padding: 12, position: 'relative', zIndex: 1}}>
            <Autocomplete
                multiple
                size="small"
                options={tags}
                value={selecteds}
                freeSolo
                onChange={(e, v, r) => onChange(v, r)}
                getOptionLabel={(option) => option.name}
                renderTags={(value, getTagProps) => {
                    return value.map((option, index) => {
                        const backgroundColor = darkenColor(option.color || '#eee', 0.2);
                        const textColor = getContrastColor(backgroundColor);
                        return (
                            <Chip
                                variant="outlined"
                                style={{
                                    backgroundColor: backgroundColor,
                                    color: textColor,
                                    border: `1px solid ${darkenColor(backgroundColor, 0.1)}`
                                }}
                                label={option.name}
                                {...getTagProps({ index })}
                                size="small"
                            />
                        );
                    });
                }}
                renderInput={(params) => (
                    <TextField {...params} variant="outlined" placeholder="Tags" />
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
                PopperProps={{
                    style: {
                        zIndex: 9999
                    },
                    placement: 'bottom-start'
                }}
            />
        </Paper>
    )
}