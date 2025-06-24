import { Box, Chip, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useState } from "react";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { darkenColor, getContrastColor } from "../../utils/colorGenerator";

export function TagsFilter({ onFiltered }) {
  const [tags, setTags] = useState([]);
  const [selecteds, setSelecteds] = useState([]);

  useEffect(() => {
    async function fetchData() {
      await loadTags();
    }
    fetchData();
  }, []);

  const loadTags = async () => {
    try {
      const { data } = await api.get(`/tags/list`);
      setTags(data);
    } catch (err) {
      toastError(err);
    }
  };

  const onChange = async (value) => {
    setSelecteds(value);
    onFiltered(value);
  };

  return (
    <Box style={{ padding: 10 }}>
      <Autocomplete
        multiple
        size="small"
        options={tags}
        value={selecteds}
        onChange={(e, v, r) => onChange(v)}
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
          <TextField
            {...params}
            variant="outlined"
            placeholder="Filtro por Tags"
          />
        )}
      />
    </Box>
  );
}
