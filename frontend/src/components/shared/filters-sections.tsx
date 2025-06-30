import {
  DropdownAutocompleteTree,
  DropdownAutocompleteTreeProps,
  SearchField,
  SearchFieldProps,
  SelectNodeType,
  Stack,
  Typography,
  useDropdownAutocompleteTree
} from '@outshift/spark-design';
import {useEffect} from 'react';

interface CustomDropdownProps
  extends Omit<
    DropdownAutocompleteTreeProps,
    'flattenedTreeOptions' | 'setSearchText' | 'toggleExpand' | 'updateCheckbox' | 'selectAllNode' | 'searchText'
  > {
  treeData: SelectNodeType[];
  onSelectValues?: (selectedValues: SelectNodeType[]) => void;
}

interface FilterSectionProps {
  searchFieldProps?: SearchFieldProps;
  dropDowns?: CustomDropdownProps[];
  title?: string;
}

export const FilterSections = ({title, searchFieldProps, dropDowns}: FilterSectionProps) => {
  return (
    <Stack marginBottom="16px">
      {title && (
        <Typography variant="h6" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
          {title}
        </Typography>
      )}
      <Stack direction="row" gap={2} alignItems="center" justifyContent="end">
        {searchFieldProps && <SearchField sx={{'& .MuiInputBase-root': {marginTop: 0, width: '320px', height: '32px'}}} {...searchFieldProps} />}
        {dropDowns?.map((dropdown, index) => <CustomDropdown key={index} {...dropdown} />)}
      </Stack>
    </Stack>
  );
};

const CustomDropdown = ({treeData, onSelectValues, isSearchFieldEnabled, ...props}: CustomDropdownProps) => {
  const {flattenedTreeOptions, onSelectAllChange, selectAllNode, selectedValues, setSearchText, toggleExpand, updateCheckbox, searchTextDebounced} =
    useDropdownAutocompleteTree({
      treeData: treeData,
      parentSelectOnly: true,
      selectAllIcon: null
    });

  useEffect(() => {
    onSelectValues?.(selectedValues);
  }, [selectedValues, onSelectValues]);

  return (
    <DropdownAutocompleteTree
      flattenedTreeOptions={
        isSearchFieldEnabled ? flattenedTreeOptions.flattenedSelectTreeWithSearch : flattenedTreeOptions.flattenedSelectTreeWithoutSearch
      }
      onSelectAllChange={onSelectAllChange}
      searchText={searchTextDebounced}
      setSearchText={setSearchText}
      selectAllNode={selectAllNode}
      toggleExpand={toggleExpand}
      updateCheckbox={updateCheckbox}
      isSearchFieldEnabled={isSearchFieldEnabled}
      popOverPaperSx={{
        width: 'fit-content'
      }}
      {...props}
    />
  );
};
