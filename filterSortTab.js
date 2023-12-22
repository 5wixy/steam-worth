export function createFilterSortTab(filterOptions, sortOptions) {
  const filterSortTab = document.createElement('div');
  filterSortTab.classList.add('dropdown-container'); 
  filterSortTab.id = 'divINdiv';

  // Create checkboxes for filter options
  if (filterOptions) {
    const checkboxContainer = document.createElement('div');
    checkboxContainer.classList.add('dropdown'); 

    const checkboxBtn = document.createElement('button');
    checkboxBtn.classList.add('dropdown-button'); 
    checkboxBtn.textContent = 'Filter by';

    checkboxContainer.appendChild(checkboxBtn);

    const checkboxContent = document.createElement('div');
    checkboxContent.classList.add('dropdown-content'); 
    checkboxContent.style.maxHeight = '0'; 
    checkboxContent.style.overflow = 'hidden';
    checkboxContent.style.transition = 'max-height 0.5s ease-out';

    filterOptions.forEach(item => {
      const checkboxLabel = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = item;

      checkboxLabel.appendChild(checkbox);
      checkboxLabel.appendChild(document.createTextNode(` ${item}`));

      checkboxContent.appendChild(checkboxLabel);
    });

    checkboxContainer.appendChild(checkboxContent);
    filterSortTab.appendChild(checkboxContainer);

    // Toggle dropdown on button click
    checkboxBtn.addEventListener('mouseenter', () => {
      checkboxContent.style.maxHeight = '200px';
    });
    
    // Hide dropdown when not hovering over the button
    checkboxBtn.addEventListener('mouseleave', () => {
      checkboxContent.style.maxHeight = '0';
    });
  }

  // Create the button for the pseudo-dropdown
  const dropdownBtn = document.createElement('button');
  dropdownBtn.classList.add('dropdown-button'); 
  dropdownBtn.textContent = 'Sort by';
  filterSortTab.appendChild(dropdownBtn);

  // Create the pseudo-dropdown content for sorting options
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content'); 
  dropdownContent.style.maxHeight = '0'; 
  dropdownContent.style.overflow = 'hidden';
  dropdownContent.style.transition = 'max-height 0.5s ease-out';

  // Create options for each sort type
  if (sortOptions) {
    sortOptions.forEach(item => {
      const optionElement = document.createElement('a');
      optionElement.href = '#'; 
      optionElement.textContent = `${item}`; 
      dropdownContent.appendChild(optionElement);
    });

    filterSortTab.appendChild(dropdownContent);

    // Toggle dropdown on button click
    dropdownBtn.addEventListener('mouseenter', () => {
      dropdownContent.style.maxHeight = '200px';
    });
    
    // Hide dropdown when not hovering over the button
    dropdownBtn.addEventListener('mouseleave', () => {
      dropdownContent.style.maxHeight = '0';
    });
  }

  return filterSortTab;
}