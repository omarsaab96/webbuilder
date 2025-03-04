let componentCounter = 0; // For unique component IDs
const apiUrl = "http://localhost:3000/";

let componentFiles = [];
let stylesEditsArray = [];
let fontColor_pickrjs = null;
let borderColor_pickrjs = null;
let backgroundColor_pickrjs = null;

$(document).ready(function () {
    componentCounter = 0
    getComponents();

    // $('#test').on('input',function () {
    //     $('#res').text(isValidSpacingShortHand($(this).val()));
    // })
});

//GET COMPONENTS FROM BACKEND
function getComponents() {
    $.ajax({
        url: apiUrl + "component-files",
        method: 'GET',
        success: function (data) {
            componentFiles = data;
            // console.log("componentFiles= ", componentFiles);
            parseComponents();
        },
        error: function (err) {
            console.error('Error fetching component files:', err);
        }
    });
}

//LOAD COMPONENTS
function parseComponents() {
    // Group components by type
    const groupedComponents = {};
    componentFiles.forEach(item => {
        if (!groupedComponents[item.type]) {
            groupedComponents[item.type] = [];
        }
        groupedComponents[item.type].push(item.path);
    });

    // Sort groupedComponents by alphabetical order a to z
    const sortedGroupedComponents = Object.keys(groupedComponents).sort().reduce((acc, key) => {
        acc[key] = groupedComponents[key];
        return acc;
    }, {});

    // Create HTML structure dynamically
    $.each(sortedGroupedComponents, function (type, paths) {
        const categoryWrapper = $('<div class="toggleItem"></div>');

        // Create the categoryTitle div
        const categoryTitle = $('<div class="toggleTitle"></div>').text(type);

        categoryWrapper.append(categoryTitle);

        const categoryPreviewer = $('<div class="previewComponents"></div>');
        categoryPreviewer.append("<a href='javascript:closePreviewer();' class='close'>close</a>");
        categoryPreviewer.append("<div class='itemsList'></div>");
        categoryWrapper.append(categoryPreviewer);

        // Loop through paths and create categoryItem divs
        paths.forEach(function (path) {
            const categoryItem = $('<div class="item"></div>');

            const link = $('<a class="btn btn-primary" id="btn_' + path.replace(".", "") + '">Use component</a>').attr('href', 'javascript:useComponent("' + path + '");');


            // Fetch the HTML content for the component from the backend
            $.ajax({
                url: apiUrl + "component/" + type + "/" + path, // Call the backend endpoint to get the HTML
                method: 'GET',
                success: function (data) {
                    // Inject the HTML content into the item
                    const htmlContent = $('<div class="preview"></div>').html(data);
                    const componentCardBottom = $('<div class="componentCardBottom d-flex align-items-center justify-content-between"></div>');
                    const componentName = $('<div class="componentName"></div>').text(path);
                    const componentActions = $('<div class="actions"></div>');

                    componentActions.append(link)
                    componentActions.prepend("<span class='usedspan fs-6 fst-italic text-muted fw-light'>Already used<span>")

                    componentCardBottom.append(componentName);
                    componentCardBottom.append(componentActions);

                    categoryItem.append(htmlContent);
                    categoryItem.append(componentCardBottom);
                },
                error: function () {
                    console.error('Failed to load component: ' + path);
                }
            });

            // Append the categoryItem div to the wrapper
            categoryPreviewer.find('.itemsList').append(categoryItem);
        });

        // Append the wrapper to the components container
        $('#components').append(categoryWrapper);

        categoryPreviewer.wrap("<div class='previewerOverlay'></div>")
    });

    $('.toggleTitle').click(function () {
        if ($(this).hasClass('open')) {
            closePreviewer();
        } else {
            closePreviewer();
            $(this).parent().find('.previewerOverlay').addClass('show');
            $(this).addClass('open')

            // if (!$(this).parents('.components').hasClass('expand')) {
            //     $(this).parents('.components').addClass('expand')
            // }
        }
    })

}

//ADD COMPONENT TO WEBSITE
function useComponent(path) {
    // Add component to final website
    const selectedComponent = componentFiles.find(item => item.path === path);
    const componentId = 'component-' + componentCounter++;

    if (selectedComponent) {
        // Make an AJAX call to fetch the component HTML from the backend
        $.ajax({
            url: apiUrl + "component/" + selectedComponent.type + "/" + selectedComponent.path, // Use backend API to get the component HTML
            method: 'GET',
            success: function (data) {
                // Create the HTML structure for the component
                const componentWrapper = `<div class='component-wrapper' id='${componentId}'>
                        ${data}
                        <div class="removeOnBuild">
                            <a class='btn btn-primary edit-btn' href='javascript:editComponent("${componentId}")'>Edit</a>
                            <a class='btn btn-danger remove-btn' href='javascript:removeComponent("${componentId}")'>Remove</a>
                        </div>`;

                // Append the component wrapper to the output container
                $('#outputContainer').append(componentWrapper);


                $("#btn_" + path.replace(".", "")).parent().addClass('used');

                // $('#componentPlacedOnWebsite').find('.toast-body').html("Component <b>" + path + "</b> added")

                // new bootstrap.Toast($('#componentPlacedOnWebsite'), {

                // }).show();

                closePreviewer();
            },
            error: function () {
                console.error('Failed to add component: ' + selectedComponent.path);
            }
        });
    }


}

//REMOVE COMPONENT FROM WEBSITE AFTER BEING ADDED
function removeComponent(id) {
    // Remove component from final website
    $('#outputContainer').find('#' + id).remove();
}

//DOWNLOAD FINAL WEBSITE
function buildWebsite() {
    try {
        // Clone the output container and remove the remove buttons
        let finalHTML = $('#outputContainer').clone();
        finalHTML.find('.removeOnBuild').remove();

        // Create the final HTML structure
        const finalHtml = `<!DOCTYPE html>
                <html>
                <head>
                    <title>Downloaded Website</title>
                    <link rel="preconnect" href="https://rsms.me/">
                    <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
                    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                    <style>
                        ${stylesEditsArray.map(style => `${style}`).join('')}
                    </style>
                </head>
                <body>
                    ${finalHTML.html()}
                    <script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
                </body>
                </html>`;

        // Create a Blob from the final HTML
        const blob = new Blob([finalHtml], {
            type: 'text/html'
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'website.html';
        link.click();

        // Provide user feedback
        console.log('Website download started.');
    } catch (error) {
        console.error('Error downloading website:', error);
        alert('An error occurred while downloading the website.');
    }
}

//CLOSE THE PREVIEW COMPONENTS WINDOW
function closePreviewer() {
    $('.previewerOverlay').removeClass('show');
    $('.toggleTitle').removeClass('open')
    // $('.components').removeClass('expand')
}

//OPEN 'ADD NEW COMPONENT' WINDOW
function addNewcomponent() {

    $.ajax({
        url: apiUrl + "component-types", // Call the backend API to get component types
        method: 'GET',
        success: function (data) {
            // Assuming data is an array of component types
            const select = $('#newComponentType');
            data.forEach(function (type) {
                const option = $('<option></option>').val(type).text(type.charAt(0).toUpperCase() + type.slice(1)); // Capitalize first letter
                select.append(option);
            });

            select.append("<option value='other'>Other</option>")

            $('.newComponentPopup').addClass('show');

            $('#newComponentType').change(function () {
                const selectedValue = $(this).val();
                if (selectedValue === 'other') {
                    $('#newComponentType').addClass('d-none')
                    $('#customTypeInput').removeClass('d-none').focus();
                } else {
                    $('#newComponentType').removeClass('d-none');
                    $('#customTypeInput').addClass('d-none').val('');
                }
            });

            $(document).mouseup(function (e) {
                var container = $(".newComponentPopup .content");

                if (!container.is(e.target) && container.has(e.target).length === 0) {
                    closePopup();
                }
            });

            $(document).on('keydown', function (e) {
                if (e.keyCode === 27) { // ESC
                    closePopup();
                }
            });

        },
        error: function (err) {
            console.error('Error fetching component types:', err);
        }
    });


}

//CLOSE ALL POPUPS
function closePopup() {
    $('.popup').removeClass('show');
}

//VALIDATE THE INPUT OF THE 'ADD NEW COMPONENT' FORM
function validateNewComponentForm() {
    var once = false;

    if (areAllInputsFilled()) {
        // Send data to the server using AJAX
        $.ajax({
            url: apiUrl + "create-file", // The back-end endpoint
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                type: $('#newComponentType').val() === 'other' ? $('#customTypeInput').val() : $('#newComponentType').val(),
                filename: $('#newComponentName').val(),
                content: $('#newComponentStructure').val()
            }),
            success: function (response) {

                console.log('Response from server:', response);

                $('#newComponentForm')[0].reset();
                $('#newComponentForm').removeClass('was-validated');
                $('#newComponentForm .form-select').removeClass('is-valid is-invalid');
                $('#newComponentForm .form-control').removeClass('is-valid is-invalid');

                closePopup();

                console.log('success')

                new bootstrap.Toast($('#newComponentSuccess'), {

                }).show();
            },
            error: function (xhr, status, error) {
                alert("Error creating file: " + error);
            }
        });
    } else {
        if (!once) {
            once = true;
            $('#newComponentForm .is-invalid').each(function () {
                $(this).on('change', function () {
                    areAllInputsFilled();
                })
            });
        }
    }
}

//CHECK IF ALL FIELDS ARE FILLED
function areAllInputsFilled() {
    var res = false;

    var componentType = $('#newComponentType').val();
    var componentNewType = $('#customTypeInput').val();
    var componentName = $('#newComponentName').val();
    var componentStructure = $('#newComponentStructure').val();


    if (componentType == null) {
        $('#newComponentType').addClass('is-invalid');
    } else {
        if (componentType === 'other') {
            if (componentNewType === '') {
                $('#customTypeInput').addClass('is-invalid');
            } else {
                componentType = componentNewType;
                $('#customTypeInput').removeClass('is-invalid').addClass('is-valid');
            }
        } else {
            $('#newComponentType').removeClass('is-invalid').addClass('is-valid');
        }

    }

    if (componentName === '') {
        $('#newComponentName').addClass('is-invalid');
    } else {
        $('#newComponentName').removeClass('is-invalid').addClass('is-valid');
    }

    if (componentStructure === '') {
        $('#newComponentStructure').addClass('is-invalid');
    } else {
        $('#newComponentStructure').removeClass('is-invalid').addClass('is-valid');
    }

    if (componentType != null && newComponentName != '' && componentStructure != '') {
        res = true
    }

    return res;
}

$(document).mouseup(function (e) {
    var container = $(".previewComponents");

    if (!container.is(e.target) && container.has(e.target).length === 0) {
        closePreviewer();
    }
});

$(document).on('keydown', function (e) {
    if (e.keyCode === 27) { // ESC
        closePreviewer();
    }
});

function editComponent(componentId) {
    const componentElement = document.getElementById(componentId);
    if (!componentElement) return;

    openStyleEditor(componentElement);
}

function openStyleEditor(component) {
    selectedComponent = component;
    selectedElement = component;

    generateElementList(selectedComponent.id);

    $('.styleEditorPopup').addClass('show');
}

function closeStyleEditor() {
    $('.styleEditorPopup').removeClass('show');
}

function generateElementList(componentId) {
    const component = document.getElementById(componentId);
    if (!component) return;

    const container = document.getElementById("elementListContainer");
    if (!container) return;

    container.innerHTML = ""; // Clear previous list

    function createList(parentElement) {
        const ul = document.createElement("ul");
        const children = Array.from(parentElement.children).filter(child =>
            !child.classList.contains("removeOnBuild")
        );

        const tagMap = new Map();

        children.forEach((child) => {
            const tag = child.tagName.toLowerCase();
            if (!tagMap.has(tag)) {
                tagMap.set(tag, []);
            }
            tagMap.get(tag).push(child);
        });

        tagMap.forEach((elements, tag) => {
            if (elements.length > 1) {
                const groupLi = document.createElement("li");
                const groupDiv = document.createElement("div");
                groupDiv.className = "liTitle";
                groupDiv.textContent = `${tag}`;
                groupLi.appendChild(groupDiv);
                ul.appendChild(groupLi);

                const groupUl = document.createElement("ul");
                groupLi.appendChild(groupUl);

                elements.forEach((child, index) => {
                    const individualLi = document.createElement("li");
                    individualLi.classList.add("singleElement");
                    individualLi.textContent = `${tag}:nth-child(${index + 1})`;
                    groupUl.appendChild(individualLi);

                    if (child.children.length > 0) {
                        individualLi.appendChild(createList(child));
                    }
                });
            } else {
                const individualLi = document.createElement("li");
                if (elements[0].children.length > 0) {
                    const div = document.createElement("div");
                    div.className = "liTitle";
                    div.textContent = `${tag}`;
                    individualLi.appendChild(div);
                } else {
                    individualLi.textContent = `${tag}`;
                }
                ul.appendChild(individualLi);

                if (elements[0].children.length > 0) {
                    individualLi.appendChild(createList(elements[0]));
                }
            }
        });

        return ul;
    }

    // Create the root element label
    const rootLi = document.createElement("li");
    const groupDiv = document.createElement("div");
    groupDiv.className = "liTitle";
    groupDiv.textContent = `#${componentId}`;
    rootLi.appendChild(groupDiv);
    container.appendChild(rootLi);

    // Generate and append the list of child elements
    const rootList = createList(component);
    rootLi.appendChild(rootList);

    $('.liTitle').each(function () {
        let thisText = $(this).text();
        $(this).html("<div class='groupToggle'></div><div class='groupTitle'>" + thisText + "</div>")
    });
    $('.singleElement').each(function () {
        let thisText = $(this).text();
        $(this).html("<div class='groupTitle'>" + thisText + "</div>")
    });
    $('.groupToggle').click(function () {
        if ($(this).parent().parent().hasClass('expanded')) {
            $(this).parent().parent().find('>ul').slideUp();
            $(this).parent().parent().removeClass('expanded');
        } else {
            $(this).parent().parent().find('>ul').slideDown();
            $(this).parent().parent().addClass('expanded');
        }
    })
    $('.groupTitle').click(function () {
        const elementText = $(this).text();
        let selectorParts = [];
        let lastTag = '';
        let hasNthChild = elementText.includes(':nth-child');

        // Start with current element
        let $current = $(this).closest('li');

        // Build selector from bottom up
        while ($current.length) {
            let text = "";
            if ($current.hasClass('singleElement')) {
                text = $current.find('> .groupTitle').text();
            } else {
                text = $current.find('> .liTitle .groupTitle').text();
            }

            // Extract the tag name without nth-child part
            let currentTag = text.split(':')[0];

            // Only check for redundancy if we're dealing with nth-child selectors
            if (hasNthChild) {
                if (currentTag !== lastTag) {
                    selectorParts.unshift(text);
                    lastTag = currentTag;
                }
            } else {
                // If no nth-child involved, add all elements
                selectorParts.unshift(text);
            }

            $current = $current.parent().closest('li');
        }

        // Create the final selector
        const selector = selectorParts.join(' > ');

        const elementStyles = getStyles(selector);

        // Update the cssSelector element with formatted styles
        $('#cssSelector').html(`
            <div class='text-muted'>${selector}</div>
            <div class="styles-container">${formatStylesForDisplay(elementStyles)}</div>
        `);

        

        //expand/collapse style groups
        $('.style-group').each(function () {
            //wrap all the divs with class sub-property in a div with class subStylesGroup if style-group has an element with class composite
            if ($(this).find('.composite').length > 0) {
                $(this).find('.sub-property').wrapAll('<div class="subStylesGroup"></div>');
                $(this).find('.composite .style-property').click(function () {
                    if ($(this).hasClass('open')) {
                        $(this).removeClass('open')
                        $(this).parent().parent().find('.subStylesGroup').slideUp();
                    } else {
                        $(this).addClass('open')
                        $(this).parent().parent().find('.subStylesGroup').slideDown();
                    }
                });
            }
        });

        $('.group_shadow .subStylesGroup').append(`
            <div class='shadowGenerator'>
                <div class="preview-box"></div>
                <div class="controls">
                    <div class="xy-offset-container">
                        <div class="xy-offset-handle"></div>
                    </div>
                    <div class="values-container">
                        <label><input type="checkbox" id="inset"> Inset</label><br>
                        <label>X Offset: <input type="number" id="xOffset" value="5"></label>
                        <label>Y Offset: <input type="number" id="yOffset" value="5"></label>
                        <label>Blur: <input type="number" id="blurRadius" value="10"></label>
                        <label>Spread: <input type="number" id="spreadRadius" value="0"></label>
                    </div>
                </div>

                
                <label>Opacity: <input type="range" id="opacity" min="0" max="1" step="0.1" value="0.5"></label><br>
                <label>Color: <input type="color" id="shadowColor" value="#000000"></label>
                

                <textarea id="cssOutput" readonly></textarea><br>
                <button class="copy-btn">Copy CSS</button>
            </div>`);

            shadowInit();

        // Add change listeners to the new inputs
        setTimeout(function () {
            $('.style-value-input').on('blur', function () {
                const property = $(this).data('property');
                const value = $(this).val();
                inputChangeDetected(this.id, selector, property, value);
            });
            $('.style-value-input').on('input', function () {
                $(this).removeClass('error');
            });
        }, 1000);

        pickerjs();
        selectableInit();
        
    });
}

function inputChangeDetected(field, selector, property, value) {
    const element = document.querySelector(selector);
    if (!element) return;

    if (field == "color") {
        if (value.includes('rgb')) {
            fontColor_pickrjs.setColorRepresentation("RGBA")
        } else {
            fontColor_pickrjs.setColorRepresentation("HEXA")
        }

        fontColor_pickrjs.setColor(value)
    }

    if (field == "border-color") {
        if (value.includes('rgb')) {
            borderColor_pickrjs.setColorRepresentation("RGBA")
        } else {
            borderColor_pickrjs.setColorRepresentation("HEXA")
        }

        borderColor_pickrjs.setColor(value);
    }

    if (field == "outline-color") {
        if (value.includes('rgb')) {
            outlineColor_pickrjs.setColorRepresentation("RGBA")
        } else {
            outlineColor_pickrjs.setColorRepresentation("HEXA")
        }

        outlineColor_pickrjs.setColor(value);
    }

    if (field == "background-color") {
        if (value.includes('rgb')) {
            backgroundColor_pickrjs.setColorRepresentation("RGBA")
        } else {
            backgroundColor_pickrjs.setColorRepresentation("HEXA")
        }

        backgroundColor_pickrjs.setColor(value)
    }

    if (field == "border" || field == "outline") {
        if (isValidBorderShortHand(value)) {

            let subProperties = splitBorderShorthand(value)

            console.log(subProperties)

            if (subProperties.length == 1 && subProperties[0] == "none") {
                $('#' + field + '-width').val('0px');
                $('#' + field + '-style').val('none');
            } else {
                $('#' + field).val(subProperties[0] + " " + subProperties[1] + " " + subProperties[2]);
                $('#' + field + '-width').val(subProperties[0]);
                $('#' + field + '-style').val(subProperties[1]);
                $('#' + field + '-color').val(subProperties[2]);
                if (field == "border") {
                    borderColor_pickrjs.setColor(subProperties[2], true);
                    borderColor_pickrjs.applyColor();
                }
                if (field == "outline") {
                    outlineColor_pickrjs.setColor(subProperties[2], true);
                    outlineColor_pickrjs.applyColor();
                }
            }



        } else {
            $('#' + field).addClass('error')
            $('#' + field + '-width').val('');
            $('#' + field + '-style').val('');
            $('#' + field + '-color').val('');
            if (field == "border") {
                borderColor_pickrjs.setColor('transparent', true);
                borderColor_pickrjs.applyColor();
            }
            if (field == "outline") {
                outlineColor_pickrjs.setColor('transparent', true);
                outlineColor_pickrjs.applyColor();
            }

        }
    }

    if (field == "border-width" || field == "outline-width") {
        if (isValidPaddingOrMargin(value)) {
            $('#' + field).val(ifJustNumberAddPxUnit(value))

            if (field == "border-width") {
                if ($('#' + field).val() == "0px") {
                    $('#border').val('none');
                } else {
                    if ($('#border-style').val() == "none") {
                        $('#border').val('none');
                    } else {
                        $('#border').val(ifJustNumberAddPxUnit($('#border-width').val()) + " " + $('#border-style').val() + " " + $('#border-color').val());
                    }
                }
            }

            if (field == "outline-width") {
                if ($('#' + field).val() == "0px") {
                    $('#outline').val('none');
                } else {
                    if ($('#outline-style').val() == "none") {
                        $('#outline').val('none');
                    } else {
                        $('#outline').val(ifJustNumberAddPxUnit($('#outline-width').val()) + " " + $('#outline-style').val() + " " + $('#outline-color').val());
                    }
                }
            }
        } else {
            if (field == "border-width") {
                $('#border').val('');
                $('#border-width').addClass('error')
            }
            if (field == "outline-width") {
                $('#outline').val('');
                $('#outline-width').addClass('error')
            }
        }
    }

    if (field == "border-style" || field == "outline-style") {
        if (isValidBorderStyle(value)) {
            if (field == "border-style") {
                if (value == 'none') {
                    $('#border').val('none');
                } else {
                    if ($('#border-width').val() == "0px") {
                        $('#border').val('none');
                    } else {
                        $('#border').val($('#border-width').val() + " " + $('#border-style').val() + " " + $('#border-color').val());
                    }
                }
            }
            if (field == "outline-style") {
                if (value == 'none') {
                    $('#outline').val('none');
                } else {
                    if ($('#outline-width').val() == "0px") {
                        $('#outline').val('none');
                    } else {
                        $('#outline').val($('#outline-width').val() + " " + $('#outline-style').val() + " " + $('#outline-color').val());
                    }
                }
            }
        } else {

            if (field == "border-style") {
                $('#border').val('');
                $('#border-style').addClass('error')
            }
            if (field == "outline-style") {
                $('#outline').val('');
                $('#outline-style').addClass('error')
            }
        }
    }

    if (field == 'border-radius') {
        if (isValidSpacingShortHand(value)) {
            $('#' + field).removeClass('error');
            let subProperties = splitSpacingShorthand(value);

            let topleft = topright = bottomright = bottomleft = 0;

            switch (subProperties.length) {
                case 1:
                    topleft = bottomright = topright = bottomleft = ifJustNumberAddPxUnit(subProperties[0]);
                    break;
                case 2:
                    topleft = bottomright = ifJustNumberAddPxUnit(subProperties[0]);
                    topright = bottomleft = ifJustNumberAddPxUnit(subProperties[1]);
                    break;
                case 3:
                    topleft = ifJustNumberAddPxUnit(subProperties[0]);
                    topright = bottomleft = ifJustNumberAddPxUnit(subProperties[1]);
                    bottomright = ifJustNumberAddPxUnit(subProperties[2]);
                    break;
                case 4:
                    topleft = ifJustNumberAddPxUnit(subProperties[0]);
                    topright = ifJustNumberAddPxUnit(subProperties[1]);
                    bottomright = ifJustNumberAddPxUnit(subProperties[2]);
                    bottomleft = ifJustNumberAddPxUnit(subProperties[3]);
                    break;
                default:
                    break;
            }

            if ((topleft == bottomright) && (topright == bottomleft) && (topleft == topright)) {
                $('#' + field).val(topleft)
            } else if ((topleft == bottomright) && (topright == bottomleft) && (topleft != topright)) {
                $('#' + field).val(topleft + " " + topright)
            } else if ((topleft != bottomright) && (topright == bottomleft)) {
                $('#' + field).val(topleft + " " + topright + " " + bottomright)
            } else {
                $('#' + field).val(topleft + " " + topright + " " + bottomright + " " + bottomleft)
            }

            //if just a number add px unit
            $('#border-top-left-radius').val(topleft);
            $('#border-top-right-radius').val(topright);
            $('#border-bottom-right-radius').val(bottomright);
            $('#border-bottom-left-radius').val(bottomleft);

        } else {
            console.log('wrong syntax for ' + field);
            $('#' + field).addClass('error');
            $('#border-top-left-radius').val('0px');
            $('#border-top-right-radius').val('0px');
            $('#border-bottom-right-radius').val('0px');
            $('#border-bottom-left-radius').val('0px');
        }
    }

    if (field == 'border-top-left-radius' || field == 'border-top-right-radius' || field == 'border-bottom-right-radius' || field == 'border-bottom-left-radius') {
        if (isValidPaddingOrMargin(value)) {
            value = ifJustNumberAddPxUnit(value);
            $('#' + field).val(value)

            let corner1 = $('#border-top-left-radius').val();
            let corner2 = $('#border-top-right-radius').val();
            let corner3 = $('#border-bottom-right-radius').val();
            let corner4 = $('#border-bottom-left-radius').val();

            if ((corner1 == corner3) && (corner2 == corner4) && (corner1 == corner2)) {
                $('#border-radius').val(corner1)
            } else if ((corner1 == corner3) && (corner2 == corner4) && (corner1 != corner2)) {
                $('#border-radius').val(corner1 + " " + corner2)
            } else if ((corner1 != corner3) && (corner2 == corner4)) {
                $('#border-radius').val(corner1 + " " + corner2 + " " + corner3)
            } else {
                $('#border-radius').val(corner1 + " " + corner2 + " " + corner3 + " " + corner4)
            }


        } else {
            $('#border-radius').val('');
            $('#' + field).addClass('error')
        }
    }

    if (field == "padding" || field == "margin") {
        //analyse input value
        if (isValidSpacingShortHand(value)) {
            $('#' + field).removeClass('error');
            let subProperties = splitSpacingShorthand(value);

            let top = right = bottom = left = 0;

            switch (subProperties.length) {
                case 1:
                    top = bottom = right = left = ifJustNumberAddPxUnit(subProperties[0]);
                    break;
                case 2:
                    top = bottom = ifJustNumberAddPxUnit(subProperties[0]);
                    right = left = ifJustNumberAddPxUnit(subProperties[1]);
                    break;
                case 3:
                    top = ifJustNumberAddPxUnit(subProperties[0]);
                    right = left = ifJustNumberAddPxUnit(subProperties[1]);
                    bottom = ifJustNumberAddPxUnit(subProperties[2]);
                    break;
                case 4:
                    top = ifJustNumberAddPxUnit(subProperties[0]);
                    right = ifJustNumberAddPxUnit(subProperties[1]);
                    bottom = ifJustNumberAddPxUnit(subProperties[2]);
                    left = ifJustNumberAddPxUnit(subProperties[3]);
                    break;
                default:
                    break;
            }

            if ((top == bottom) && (right == left) && (top == right)) {
                $('#' + field).val(top)
            } else if ((top == bottom) && (right == left) && (top != right)) {
                $('#' + field).val(top + " " + right)
            } else if ((top != bottom) && (right == left)) {
                $('#' + field).val(top + " " + right + " " + bottom)
            } else {
                $('#' + field).val(top + " " + right + " " + bottom + " " + left)
            }

            //if just a number add px unit
            $('#' + field + '-top').val(top);
            $('#' + field + '-right').val(right);
            $('#' + field + '-bottom').val(bottom);
            $('#' + field + '-left').val(left);

        } else {
            console.log('wrong syntax for ' + field);
            $('#' + field).addClass('error');
            $('#' + field + '-top').val('0px');
            $('#' + field + '-right').val('0px');
            $('#' + field + '-bottom').val('0px');
            $('#' + field + '-left').val('0px');
        }
    }

    if (field == "padding-top" || field == "padding-right" || field == "padding-bottom" || field == "padding-left" || field == "margin-top" || field == "margin-right" || field == "margin-bottom" || field == "margin-left") {
        if (value.includes('calc')) {
            if (!isValidCalc(value)) {
                $('#' + field).addClass('error');
                if (field.includes('padding')) {
                    $('#padding').val('');
                }

                if (field.includes('margin')) {
                    $('#margin').val('');
                }
            } else {
                value = ifJustNumberAddPxUnit(value);
                $('#' + field).val(value)

                if (field.includes('padding')) {
                    let pt = $('#padding-top').val();
                    let pr = $('#padding-right').val();
                    let pb = $('#padding-bottom').val();
                    let pl = $('#padding-left').val();

                    if ((pt == pb) && (pr == pl) && (pt == pr)) {
                        $('#padding').val(pt);
                    } else if ((pt == pb) && (pr == pl) && (pt != pr)) {
                        $('#padding').val(pt + " " + pr);
                    } else if ((pt != pb) && (pr == pl)) {
                        $('#padding').val(pt + " " + pr + " " + pb);
                    } else {
                        $('#padding').val(pt + " " + pr + " " + pb + " " + pl);
                    }
                }

                if (field.includes('margin')) {
                    let mt = $('#margin-top').val();
                    let mr = $('#margin-right').val();
                    let mb = $('#margin-bottom').val();
                    let ml = $('#margin-left').val();

                    if ((mt == mb) && (mr == ml) && (mt == mr)) {
                        $('#margin').val(mt);
                    } else if ((mt == mb) && (mr == ml) && (mt != mr)) {
                        $('#margin').val(mt + " " + mr);
                    } else if ((mt != mb) && (mr == ml)) {
                        $('#margin').val(mt + " " + mr + " " + mb);
                    } else {
                        $('#margin').val(mt + " " + mr + " " + mb + " " + ml);
                    }
                }
            }
        } else if (!isValidPaddingOrMargin(value)) {
            $('#' + field).addClass('error');
            if (field.includes('padding')) {
                $('#padding').val('');
            }

            if (field.includes('margin')) {
                $('#margin').val('');
            }
        } else {
            value = ifJustNumberAddPxUnit(value);
            $('#' + field).val(value)

            if (field.includes('padding')) {

                let pt = $('#padding-top').val();
                let pr = $('#padding-right').val();
                let pb = $('#padding-bottom').val();
                let pl = $('#padding-left').val();

                if ((pt == pb) && (pr == pl) && (pt == pr)) {
                    $('#padding').val(pt);
                } else if ((pt == pb) && (pr == pl) && (pt != pr)) {
                    $('#padding').val(pt + " " + pr);
                } else if ((pt != pb) && (pr == pl)) {
                    $('#padding').val(pt + " " + pr + " " + pb);
                } else {
                    $('#padding').val(pt + " " + pr + " " + pb + " " + pl);
                }
            }

            if (field.includes('margin')) {
                let mt = $('#margin-top').val();
                let mr = $('#margin-right').val();
                let mb = $('#margin-bottom').val();
                let ml = $('#margin-left').val();

                if ((mt == mb) && (mr == ml) && (mt == mr)) {
                    $('#margin').val(mt);
                } else if ((mt == mb) && (mr == ml) && (mt != mr)) {
                    $('#margin').val(mt + " " + mr);
                } else if ((mt != mb) && (mr == ml)) {
                    $('#margin').val(mt + " " + mr + " " + mb);
                } else {
                    $('#margin').val(mt + " " + mr + " " + mb + " " + ml);
                }
            }
        }


    }

    if (field == "background-size" || field == "background-position") {
        setTimeout(function () {
            console.log($('#' + field).val())
        }, 500);
    }

    if (field == "background-repeat" || field == "position" || field == "display" || field == "flex-direction" || field == "align-items" || field == "justify-content" || field == "overflow" || field == "visibility") {
        setTimeout(function () {
            console.log($('#' + field).val())
        }, 500);
    }

    if (field == "font-size" || field == "line-height" || field == "width" || field == "height" || field == "min-width" || field == "min-height" || field == "max-width" || field == "max-height" || field == "top" || field == "right" || field == "bottom" || field == "left") {
        value = ifJustNumberAddPxUnit(value)
        $('#' + field).val(value)

        if (!isValidDimension(value)) {
            $('#' + field).addClass('error')
        }
    }

    if (field == "box-shadow") {
        if (CSS.supports("box-shadow", value)) {

            console.log(parseShadowShorthand(value))
        } else {
            $('#' + field).addClass('error');
        }
    }
}

function parseShadowShorthand(value) {
    let parsedProperties = {
        inset: false,
        offX: "",
        offY: "",
        blurRad: "",
        spread: "",
        color: "transparent"
    }

    if (value == "none") {
        return parsedProperties;
    } else {
        let splitShorthand = splitBorderShorthand(value);

        if (splitShorthand.length > 6) {
            return false;
        }

        for (let i = 0; i < splitShorthand.length; i++) {
            if (splitShorthand[i] == "inset") {
                parsedProperties.inset = true;
                splitShorthand.splice(i, 1);
            }
            if (isColor(splitShorthand[i])) {
                parsedProperties.color = splitShorthand[i];
                splitShorthand.splice(i, 1);
            }
        }

        if (splitShorthand.length == 2) {
            parsedProperties.offX = splitShorthand[0];
            parsedProperties.offY = splitShorthand[1];
        }

        if (splitShorthand.length == 3) {
            parsedProperties.offX = splitShorthand[0];
            parsedProperties.offY = splitShorthand[1];
            parsedProperties.blurRad = splitShorthand[2];
        }

        if (splitShorthand.length == 4) {
            parsedProperties.offX = splitShorthand[0];
            parsedProperties.offY = splitShorthand[1];
            parsedProperties.blurRad = splitShorthand[2];
            parsedProperties.spread = splitShorthand[3];
        }

        return parsedProperties;
    }
}

function isColor(value) {
    // Check for named colors (e.g., 'red', 'blue', etc.)
    const namedColorRegex = /^[a-z]+$/i;

    // Check for hex color (e.g., #fff, #ffffff, #ff0000)
    const hexColorRegex = /^#[0-9A-Fa-f]{3,6}$/;

    // Check for rgb or rgba structure
    const rgbRgbaColorRegex = /^rgba?\(\s*[^)]*\s*\)$/;

    // Check if value matches any color format
    return (
        namedColorRegex.test(value) ||
        hexColorRegex.test(value) ||
        rgbRgbaColorRegex.test(value)
    );
}

function isValidDimension(value) {
    if (typeof value !== "string") {
        return false;
    }

    // Allow "auto" as a valid dimension
    if (value === "auto" || value === "none") {
        return true;
    }

    // Regular expression to match valid CSS units
    const validUnits = ["px", "%", "em", "rem", "vw", "vh", "vmin", "vmax"];
    const unitPattern = new RegExp(`^-?\\d*\\.?\\d+(${validUnits.join("|")})$`);

    // Check for simple numeric values with units
    if (unitPattern.test(value.trim())) {
        return true;
    }

    // Check for calc() expressions
    if (value.includes('calc(')) {
        if (isValidCalc(value)) {
            return true;
        } else {
            return false;
        }
    }

    return false;
}

function splitBackgroundPositionShorthand(value) {
    value = value.trim();
    value = value.replace(/\s{2,}/g, ' ');

    let values = [];
    let currentValue = "";
    let isCalc = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isCalc) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "c" && value.slice(i, i + 5) === "calc(") {
            isCalc = true;
            currentValue += "calc(";
            i += 4;
        } else if (currentChar === ")") {
            isCalc = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }

    values.push(currentValue);

    return values;
}

function isValidBackgroundPositionShortHand(value) {
    // Valid shorthand values must be strings
    if (typeof value !== "string") return false;

    //trim excess spaces before and after
    value = value.trim();

    //replace double spaces with one space anywhere in the string
    value = value.replace(/\s{2,}/g, ' ');

    //check if the value is empty
    if (value === "") return false;

    let values = [];
    let currentValue = "";
    let isCalc = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isCalc) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "c" && value.slice(i, i + 5) === "calc(") {
            isCalc = true;
            currentValue += "calc(";
            i += 4;
        } else if (currentChar === ")") {
            isCalc = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }
    values.push(currentValue);

    if (values.length < 1 || values.length > 2) return false;


    //loop check values
    for (let val of values) {
        if (val.includes('calc')) {
            if (!isValidCalc(val)) return false;
        } else {
            if (!isValidBackgroundPositionValue(val)) return false;
        }
    }

    return true;
}

function splitBackgroundSizeShorthand(value) {
    value = value.trim();
    value = value.replace(/\s{2,}/g, ' ');

    let values = [];
    let currentValue = "";
    let isCalc = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isCalc) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "c" && value.slice(i, i + 5) === "calc(") {
            isCalc = true;
            currentValue += "calc(";
            i += 4;
        } else if (currentChar === ")") {
            isCalc = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }

    values.push(currentValue);

    return values;
}

function isValidBackgroundSizeShortHand(value) {
    // Valid shorthand values must be strings
    if (typeof value !== "string") return false;

    //trim excess spaces before and after
    value = value.trim();

    //replace double spaces with one space anywhere in the string
    value = value.replace(/\s{2,}/g, ' ');

    //check if the value is empty
    if (value === "") return false;

    let values = [];
    let currentValue = "";
    let isCalc = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isCalc) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "c" && value.slice(i, i + 5) === "calc(") {
            isCalc = true;
            currentValue += "calc(";
            i += 4;
        } else if (currentChar === ")") {
            isCalc = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }
    values.push(currentValue);

    if (values.length < 1 || values.length > 2) return false;


    //loop check values
    for (let val of values) {
        if (val.includes('calc')) {
            if (!isValidCalc(val)) return false;
        } else {
            if (!isValidBackgroundValue(val)) return false;
        }
    }

    return true;


}

function isValidBackgroundSize(value) {
    const keywords = ["auto", "cover", "contain", "custom..."];
    const unitPattern = /^(auto|cover|contain|(\d+(\.\d+)?(px|em|rem|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc|fr|calc\(.+\)))|(\d+(\.\d+)?(px|em|rem|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc|fr|calc\(.+\)) \d+(\.\d+)?(px|em|rem|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc|fr|calc\(.+\))))$/;

    return keywords.includes(value) || unitPattern.test(value.trim());
}

function isValidBackgroundValue(value) {
    const validUnits = ["px", "em", "rem", "%", "vw", "vh", "deg"];
    const validKeywords = ["auto", "contain", "cover"];

    if (typeof value !== "string") {
        return false;
    }

    value = value.trim();

    // Check if the value is one of the valid keywords
    if (validKeywords.includes(value)) {
        return true;
    }

    // Check if the value is a number (can have decimals) followed by a valid unit
    if (validUnits.some(unit => value.endsWith(unit) && /^-?\d*\.?\d+$/.test(value.slice(0, -unit.length).trim()))) {
        return true;
    }

    // Check if the value is a plain number (without units)
    if (/^-?\d*\.?\d+$/.test(value)) {
        return true;
    }

    return false;
}

function isValidBackgroundPositionValue(value) {
    const validUnits = ["px", "em", "rem", "%", "vw", "vh", "deg"];
    const validKeywords = ["auto", "top", "right", "bottom", "left"];

    if (typeof value !== "string") {
        return false;
    }

    value = value.trim();

    // Check if the value is one of the valid keywords
    if (validKeywords.includes(value)) {
        return true;
    }

    // Check if the value is a number (can have decimals) followed by a valid unit
    if (validUnits.some(unit => value.endsWith(unit) && /^-?\d*\.?\d+$/.test(value.slice(0, -unit.length).trim()))) {
        return true;
    }

    // Check if the value is a plain number (without units)
    if (/^-?\d*\.?\d+$/.test(value)) {
        return true;
    }

    return false;
}

function ifJustNumberAddPxUnit(value) {
    const whitelist = ["calc", "px", "em", "rem", "%", "vw", "vh", "deg", "auto", "contain", "cover", "top", "right", "bottom", "left", "none"]; // Extend if needed

    if (whitelist.some(char => value.includes(char))) {
        return value;
    } else {
        return value + "px";
    }

}

function splitSpacingShorthand(value) {
    value = value.trim();
    value = value.replace(/\s{2,}/g, ' ');

    let values = [];
    let currentValue = "";
    let isCalc = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isCalc) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "c" && value.slice(i, i + 5) === "calc(") {
            isCalc = true;
            currentValue += "calc(";
            i += 4;
        } else if (currentChar === ")") {
            isCalc = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }
    values.push(currentValue);

    return values;
}

function splitBorderShorthand(value) {
    value = value.trim();
    value = value.replace(/\s{2,}/g, ' ');

    let values = [];
    let currentValue = "";
    let isRGBa = false;
    let isRGB = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isRGB && !isRGBa) {
            if (currentValue !== "") {
                if (!isNaN(currentValue)) {
                    currentValue = ifJustNumberAddPxUnit(currentValue)
                }
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "r" && value.slice(i, i + 5) === "rgba(") {
            isRGBa = true;
            currentValue += "rgba(";
            i += 4;
        } else if (currentChar === "r" && value.slice(i, i + 4) === "rgb(") {
            isRGB = true;
            currentValue += "rgb(";
            i += 3;
        } else if (currentChar === ")") {
            isRGB = false;
            isRGBa = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }
    values.push(currentValue);

    return values;
}

function isValidBorderShortHand(value) {
    // Valid shorthand values must be strings
    if (typeof value !== "string") return false;

    //trim excess spaces before and after
    value = value.trim();

    //replace double spaces with one space anywhere in the string
    value = value.replace(/\s{2,}/g, ' ');

    //check if the value is empty
    if (value === "") return false;

    if (value === "none") return true;

    let values = [];
    let currentValue = "";
    let isRGBa = false;
    let isRGB = false;
    let isHEX = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isRGB && !isRGBa && !isHEX) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "r" && value.slice(i, i + 5) === "rgba(") {
            isRGBa = true;
            currentValue += "rgba(";
            i += 4;
        } else if (currentChar === "r" && value.slice(i, i + 4) === "rgb(") {
            isRGB = true;
            currentValue += "rgb(";
            i += 3;
        } else if (currentChar === ")") {
            isRGB = false;
            isRGBa = false;
            currentValue += ")";
        } else if (currentChar === "#") {
            isHEX = true;
            currentValue += "#";

            let hexLength = 0;
            while (hexLength < 8 && i + 1 < value.length && /[0-9a-fA-F]/.test(value[i + 1])) {
                currentValue += value[++i];
                hexLength++;
            }

            if (hexLength === 3 || hexLength === 6 || hexLength === 8) {
                isHEX = false;
            }

        } else {
            currentValue += currentChar;
        }
    }
    values.push(currentValue);

    if (values.length != 3) return false;

    //loop check values
    for (let val of values) {
        if (val.includes('rgba')) {
            if (!isValidRGBa(val)) return false;
        } else if (val.includes('rgb')) {
            if (!isValidRGB(val)) return false;
        } else if (val.includes('#')) {
            if (!isValidHEX(val)) return false;
        } else {
            if (!isValidPaddingOrMargin(val)) {
                if (!isValidBorderStyle(val)) return false;
            }
        }
    }

    return true;

}

function isValidSpacingShortHand(value) {
    // Valid shorthand values must be strings
    if (typeof value !== "string") return false;

    //trim excess spaces before and after
    value = value.trim();

    //replace double spaces with one space anywhere in the string
    value = value.replace(/\s{2,}/g, ' ');

    //check if the value is empty
    if (value === "") return false;

    let values = [];
    let currentValue = "";
    let isCalc = false;

    for (let i = 0; i < value.length; i++) {
        let currentChar = value[i];
        if (currentChar === " " && !isCalc) {
            if (currentValue !== "") {
                values.push(currentValue);
                currentValue = "";
            }
        } else if (currentChar === "c" && value.slice(i, i + 5) === "calc(") {
            isCalc = true;
            currentValue += "calc(";
            i += 4;
        } else if (currentChar === ")") {
            isCalc = false;
            currentValue += ")";
        } else {
            currentValue += currentChar;
        }
    }
    values.push(currentValue);

    if (values.length < 1 || values.length > 4) return false;


    //loop check values
    for (let val of values) {
        if (val.includes('calc')) {
            if (!isValidCalc(val)) return false;
        } else {
            if (!isValidPaddingOrMargin(val)) return false;
        }
    }

    return true;

}

function isValidPaddingOrMargin(value) {
    const validUnits = ["px", "em", "rem", "%", "vw", "vh", "deg"];
    let isValid = false;

    if (typeof value !== "string") {
        return false;
    }

    //check value it should be a number (can have decimals) followed by one of the valid units
    if (validUnits.some(unit => value.endsWith(unit) && /^-?\d*\.?\d+$/.test(value.slice(0, -unit.length).trim()))) {
        isValid = true;
    } else if (/^-?\d*\.?\d+$/.test(value.trim())) {
        isValid = true;
    }

    return isValid;
}

function isValidCalc(value) {
    if (typeof value !== "string") return false;

    if (value.startsWith("calc(") && value.endsWith(")")) {
        const calcInner = value.slice(5, -1).trim();

        // Ensure operators have spaces around them
        if (!/^([\w\d%]+(\s[\+\-\*\/]\s[\w\d%]+)+)$/.test(calcInner)) return false;

        const validUnits = ["px", "em", "rem", "%", "vw", "vh", "deg"];
        const tokens = calcInner.split(/\s([\+\-\*\/])\s/); // Split operands and keep operators

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i].trim();

            // Operators are valid, so skip them
            if (["+", "-", "*", "/"].includes(token)) continue;

            let hasUnit = validUnits.some(unit => token.endsWith(unit));
            let isNumber = !isNaN(token);

            if (i > 0) {
                let prevOperator = tokens[i - 1];

                if (["*", "/"].includes(prevOperator)) {
                    // For multiplication & division, the second operand must be unitless
                    if (hasUnit) return false;
                } else if (["+", "-"].includes(prevOperator)) {
                    // For addition & subtraction, both operands must have units
                    if (!hasUnit) return false;
                }
            } else {
                // The first operand must have a unit
                if (!hasUnit) return false;
            }
        }

        return true;
    }

    return false;
}

function isValidRGBa(value) {
    return /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i.test(value) &&
        value.match(/\d+(\.\d+)?/g).slice(0, 3).every(n => n >= 0 && n <= 255);
}

function isValidRGB(value) {
    return /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.test(value) &&
        value.match(/\d+/g).every(n => n >= 0 && n <= 255);
}

function isValidHEX(value) {
    // HEX color should start with '#' and have 3, 6, or 8 valid hex characters
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
}

function isValidBorderStyle(value) {
    const validStyles = [
        "none", "solid", "dotted", "dashed", "double", "groove",
        "ridge", "inset", "outset", "hidden"
    ];
    return validStyles.includes(value.toLowerCase());
}

const compositeProperties = {
    'layout': ['position', 'display', 'flex-direction', 'align-items', 'justify-content', 'top', 'right', 'bottom', 'left', 'transform', 'z-index', 'overflow', 'visibility'],
    'dimensions': ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'],
    'text': ['color', 'font-family', 'font-size', 'line-height'],
    'border': ['border-width', 'border-style', 'border-color'],
    'outline': ['outline-width', 'outline-style', 'outline-color'],
    'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
    'padding': ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    'margin': ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    'background': ['background-color', 'background-image', 'background-repeat', 'background-size', 'background-position'],
    'shadow': ['box-shadow']
};

function formatStylesForDisplay(styles) {
    let html = '';

    // Group styles by composite properties
    const grouped = {};
    const processedProperties = new Set();

    styles.forEach(style => {
        let isSubProperty = false;
        let mainProperty = style.property;

        // Check if this is a sub-property
        for (const [main, subs] of Object.entries(compositeProperties)) {
            if (subs.includes(style.property)) {
                mainProperty = main;
                isSubProperty = true;
                break;
            }
        }


        if (!grouped[mainProperty]) {
            grouped[mainProperty] = [];
        }

        // Only add if it's not already processed
        if (!processedProperties.has(style.property)) {
            grouped[mainProperty].push(style);
            processedProperties.add(style.property);
        }
    });

    // Generate HTML for each group
    for (const [mainProperty, styleGroup] of Object.entries(grouped)) {
        html += `<div class="style-group group_${mainProperty}">`;

        // Add main property if it's a composite
        if (compositeProperties[mainProperty]) {
            const mainStyle = styleGroup.find(s => s.property === mainProperty);

            if (mainStyle) {
                html += createInputRow(mainStyle, true);
            } else if (mainProperty == "layout" || mainProperty == "dimensions" || mainProperty == "text" || mainProperty == "shadow") {
                html += `<div class="style-row composite">
                            <span class="style-property">${mainProperty}</span>
                        </div>`;
            }
            // Add sub-properties
            styleGroup.forEach(style => {
                if (style.property !== mainProperty) {
                    html += createInputRow(style, false);
                }
            });
        } else {
            // Regular property
            styleGroup.forEach(style => {
                html += createInputRow(style, false);
            });
        }

        html += `</div>`;
    }

    return html;
}

function updateCompositePropertybak(selector, mainProperty, subProperty, value) {
    const element = document.querySelector(selector);
    if (!element) return;

    // Get all current values of the composite property
    const computedStyle = window.getComputedStyle(element);
    const currentValues = {};

    // First, get all current sub-property values
    if (compositeProperties[mainProperty]) {
        compositeProperties[mainProperty].forEach(prop => {
            currentValues[prop] = computedStyle.getPropertyValue(prop).trim();
        });
    }

    // Update the changed sub-property
    currentValues[subProperty] = value;

    // Construct the composite value based on property type
    let compositedValue = '';
    if (mainProperty === 'border') {
        compositedValue = `${currentValues['border-width']} ${currentValues['border-style']} ${currentValues['border-color']}`;
    } else {
        // For margin and padding
        const top = currentValues[`${mainProperty}-top`];
        const right = currentValues[`${mainProperty}-right`];
        const bottom = currentValues[`${mainProperty}-bottom`];
        const left = currentValues[`${mainProperty}-left`];

        if (top === '0px' && right === '0px' && bottom === '0px' && left === '0px') {
            compositedValue = '0px'; // All sides are 0px
        } else if (top === bottom && right === left) {
            if (top === right) {
                compositedValue = top; // All sides are the same
            } else {
                compositedValue = `${top} ${right}`; // Top/bottom and right/left are the same
            }
        } else if (right === left) {
            compositedValue = `${top} ${right} ${bottom}`; // Top, right/left, bottom
        } else {
            compositedValue = `${top} ${right} ${bottom} ${left}`; // All sides are different
        }
    }

    // Update both the composite and individual property
    element.style[mainProperty] = compositedValue;
    element.style[subProperty] = value;

    // Store the composite change and remove sub-properties
    updateStylesArray(selector, mainProperty, compositedValue);
    if (compositeProperties[mainProperty]) {
        compositeProperties[mainProperty].forEach(prop => {
            removeStyleFromArray(selector, prop);
        });
    }

    // Update the displayed value in the composite input if it exists
    const compositeInput = document.querySelector(`.style-value-input[data-property="${mainProperty}"]`);
    if (compositeInput) {
        compositeInput.value = compositedValue;
    }
}

function updateIndividualPropertiesbak(selector, mainProperty, value) {
    const element = document.querySelector(selector);
    if (!element) return;

    const values = value.split(' ').map(v => v.trim());
    const subProperties = compositeProperties[mainProperty];

    if (!subProperties) return; // Ensure subProperties is defined

    if (mainProperty === 'border') {
        // Handle border composite value
        const [borderWidth, borderStyle, borderColor] = values;
        element.style['border-width'] = borderWidth || '';
        element.style['border-style'] = borderStyle || '';
        element.style['border-color'] = borderColor || '';

        updateStylesArray(selector, 'border-width', borderWidth);
        updateStylesArray(selector, 'border-style', borderStyle);
        updateStylesArray(selector, 'border-color', borderColor);

        // Update the corresponding input fields
        document.querySelector(`.style-value-input[data-property="border-width"]`).value = parseInt(borderWidth) || 0;
        document.querySelector(`.style-value-input[data-property="border-style"]`).value = borderStyle || '';
        document.querySelector(`.style-value-input[data-property="border-color"]`).value = borderColor || 'transparent';

    } else {
        // Handle margin/padding composite value
        let top, right, bottom, left;
        if (values.length === 1) {
            top = right = bottom = left = values[0];
        } else if (values.length === 2) {
            top = bottom = values[0];
            right = left = values[1];
        } else if (values.length === 3) {
            top = values[0];
            right = left = values[1];
            bottom = values[2];
        } else if (values.length === 4) {
            top = values[0];
            right = values[1];
            bottom = values[2];
            left = values[3];
        }

        const individualValues = [top, right, bottom, left];
        subProperties.forEach((prop, index) => {
            let propertyValue = individualValues[index];
            if (!propertyValue.includes('px') && (prop.includes('width') || prop.includes('margin') || prop.includes('padding'))) {
                propertyValue += 'px';
            }

            element.style[prop] = propertyValue;
            updateStylesArray(selector, prop, propertyValue);

            const input = document.querySelector(`.style-value-input[data-property="${prop}"]`);
            if (input) {
                let inputValue = individualValues[index];
                if (input.type === 'number') {
                    inputValue = parseInt(individualValues[index]) || 0;
                } else if (input.type === 'color' && propertyValue.startsWith('rgb')) {
                    inputValue = rgbToHex(propertyValue);
                }
                input.value = inputValue;
            }
        });

        updateStylesArray(selector, mainProperty, value);
        if (compositeProperties[mainProperty]) {
            compositeProperties[mainProperty].forEach(prop => {
                removeStyleFromArray(selector, prop);
            });
        }
    }
}

function removeStyleFromArray(selector, property) {
    if (stylesEditsArray[selector]) {
        delete stylesEditsArray[selector][property];

        if (Object.keys(stylesEditsArray[selector]).length === 0) {
            delete stylesEditsArray[selector];
        }
    }
}

function getStyles(element) {
    let styles = [];
    const targetElement = document.querySelector(element);
    if (!targetElement) return styles;

    let elementStyles = window.getComputedStyle(targetElement);

    // Only get specific styles we're interested in
    const propertiesToGet = [
        'position',
        'display',
        'flex-direction',
        'align-items',
        'justify-content',
        'top',
        'right',
        'bottom',
        'left',
        'transform',
        'z-index',
        'overflow',
        'visibility',
        'width',
        'height',
        'min-width',
        'min-height',
        'max-width',
        'max-height',
        'color',
        'font-family',
        'font-size',
        'line-height',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'border',
        'border-width',
        'border-style',
        'border-color',
        'outline',
        'outline-width',
        'outline-style',
        'outline-color',
        'border-radius',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-bottom-right-radius',
        'border-bottom-left-radius',
        'background',
        'background-color',
        'background-image',
        'background-repeat',
        'background-size',
        'background-position',
        'box-shadow'
    ];

    propertiesToGet.forEach(prop => {
        styles.push({
            property: prop,
            value: elementStyles.getPropertyValue(prop)
        });
    });

    return styles;
}

function createInputRow(style, isComposite) {
    let inputType = 'text';
    let inputValue = style.value;
    let additionalElement = '';

    if (style.property == "border" || style.property == "outline") {
        if (style.value.split(" ")[0] == '0px' || style.value.split(" ")[1] == 'none') {
            inputValue = "none";
        }
    }

    if (style.property == "position") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="relative" class="style-value-input" id="position">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">relative</li>
                            <li class="option" data-selectable-value="2">absolute</li>
                            <li class="option" data-selectable-value="3">fixed</li>
                            <li class="option" data-selectable-value="4">static</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "display") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="block" class="style-value-input" id="display">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">block</li>
                            <li class="option" data-selectable-value="2">inline-block</li>
                            <li class="option" data-selectable-value="3">flex</li>
                            <li class="option" data-selectable-value="4">inline-flex</li>
                            <li class="option" data-selectable-value="5">none</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "flex-direction") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="row" class="style-value-input" id="flex-direction">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">row</li>
                            <li class="option" data-selectable-value="2">row-inverse</li>
                            <li class="option" data-selectable-value="3">column</li>
                            <li class="option" data-selectable-value="4">column-inverse</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "align-items") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="flex-start" class="style-value-input" id="align-items">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">flex-start</li>
                            <li class="option" data-selectable-value="2">flex-end</li>
                            <li class="option" data-selectable-value="3">center</li>
                            <li class="option" data-selectable-value="4">baseline</li>
                            <li class="option" data-selectable-value="5">stretch</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "justify-content") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="flex-start" class="style-value-input" id="justify-content">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">flex-start</li>
                            <li class="option" data-selectable-value="2">flex-end</li>
                            <li class="option" data-selectable-value="3">center</li>
                            <li class="option" data-selectable-value="4">space-between</li>
                            <li class="option" data-selectable-value="5">space-around</li>
                            <li class="option" data-selectable-value="6">space-evenly</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "overflow") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="visible" class="style-value-input" id="overflow">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">visible</li>
                            <li class="option" data-selectable-value="2">auto</li>
                            <li class="option" data-selectable-value="3">hidden</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "visibility") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="visible" class="style-value-input" id="visibility">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">visible</li>
                            <li class="option" data-selectable-value="2">hidden</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "background-repeat") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="no-repeat" class="style-value-input"  id="background-repeat">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">no-repeat</li>
                            <li class="option" data-selectable-value="2">repeat</li>
                            <li class="option" data-selectable-value="3">repeat-x</li>
                            <li class="option" data-selectable-value="4">repeat-y</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "background-size") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="1" value="auto" class="style-value-input" id="background-size">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">auto</li>
                            <li class="option" data-selectable-value="2">cover</li>
                            <li class="option" data-selectable-value="3">contain</li>
                            <li class="option" data-selectable-value="custom">custom...</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property == "background-position") {
        return `<div class="style-row sub-property row_${style.property}">
        <span class="style-property">${style.property}:</span>
            <div class="selectable">
                <input type="text" data-selectable-selected="8" value="center" class="style-value-input" id="background-position">
                    <div class="selectables">
                        <ul class="options">
                            <li class="option" data-selectable-value="1">top left</li>
                            <li class="option" data-selectable-value="2">top center</li>
                            <li class="option" data-selectable-value="3">top right</li>
                            <li class="option" data-selectable-value="4">bottom right</li>
                            <li class="option" data-selectable-value="5">bottom center</li>
                            <li class="option" data-selectable-value="6">bottom left</li>
                            <li class="option" data-selectable-value="7">center left</li>
                            <li class="option" data-selectable-value="8">center</li>
                            <li class="option" data-selectable-value="9">center right</li>
                            <li class="option" data-selectable-value="custom">custom...</li>
                        </ul>
                    </div>
            </div>
        </div>`
    }

    if (style.property.includes('color')) {
        inputType = 'text';
        inputValue == 'rgba(0, 0, 0, 0)' ? inputValue = 'transparent' : inputValue;
        additionalElement = '<div class="pickrjs" data-property="' + style.property + '" ></div>';
    } else if (style.property.includes('size') || style.property.includes('width') ||
        style.property.includes('margin') || style.property.includes('padding')) {
        if (isComposite) {
            inputType = 'text';
            inputValue = style.value === '0' ? '0px' : style.value;
        } else {
            inputType = 'text';
            inputValue = style.value === '0' ? '0px' : style.value;
        }
    }

    return `<div class="style-row ${isComposite ? 'composite' : 'sub-property'} row_${style.property}">
        ${style.property != 'background' ? `
            <span class="style-property">${style.property}:</span>
            <div class="flex align-items-center">
            <input type="${inputType}" 
                class="style-value-input" 
                id="${style.property}"
                data-property="${style.property}" 
                value="${inputValue}"
                ${inputType === 'number' ? 'step="1"' : ''}
            />
            ${inputType === 'number' && !isComposite ? '<span class="unit">px</span>' : ''}
            ${additionalElement}
        </div>` : `<span class="style-property">${style.property}</span>`}
    </div>`;
}

function updateStylesArray(selector, property, value) {
    // console.log(selector,property,value)
    if (!stylesEditsArray[selector]) {
        stylesEditsArray[selector] = {};
    }

    stylesEditsArray[selector][property] = value;

    let changesCSS = Object.entries(stylesEditsArray).map(([sel, props]) => {
        let properties = Object.entries(props).map(([prop, val]) => `  ${prop}: ${val};`).join('\n');
        return `${sel} {\n${properties}\n}`;
    }).join('\n\n');

    $('.changedStyles').text(changesCSS);
}

function rgbaToHex(color) {
    // Extract numbers from rgb() or rgba()
    const values = color.match(/\d+(\.\d+)?/g);
    if (!values || values.length < 3) return '#000000FF'; // Default black

    // Convert RGB to HEX
    const rgbHex = values.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    // Convert Alpha (if present) to HEX, otherwise assume full opacity
    const alphaHex = values[3] !== undefined
        ? Math.round(parseFloat(values[3]) * 255).toString(16).padStart(2, '0')
        : 'FF';

    return `#${rgbHex}${alphaHex}`.toUpperCase();
}

function pickerjs() {
    // font-color
    fontColor_pickrjs = Pickr.create({
        el: '.pickrjs[data-property="color"]',
        theme: 'monolith',
        default: '#000000',
        defaultRepresentation: 'HEXA',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                clear: true,
                save: true,
                copy: true
            }
        }
    });

    fontColor_pickrjs.on('init', (instance) => {
        if ($('#color').val() == "transparent") {
            instance.setColor("transparent", true);
        } else {
            instance.setColor(instance.getColor().toHEXA().toString(), true);
            instance.setColor(rgbaToHex($('#color').val()), true);
            $('#color').val(instance._eventBindings[4][0].value)
        }
        instance.applyColor();
    });

    fontColor_pickrjs.on('save', (color) => {
        if (color == null) return;

        if (fontColor_pickrjs.getColorRepresentation() == "HEXA") {
            let selectedColor = fontColor_pickrjs.getSelectedColor().toHEXA().toString();
            if (selectedColor.length == 9 && selectedColor.slice(-2) == "00") {
                $('#color').val('transparent')
            } else {
                $('#color').val(selectedColor)
            }
        }

        if (fontColor_pickrjs.getColorRepresentation() == "RGBA") {
            let selectedColor = fontColor_pickrjs.getSelectedColor().toRGBA().toString(0);
            if (selectedColor.split(" ")[3].replace(")", "") == "0") {
                $('#color').val('transparent')
            } else {
                $('#color').val(selectedColor)
            }
        }
    });

    fontColor_pickrjs.on('clear', () => {
        fontColor_pickrjs.setColor('rgba(0, 0, 0, 0)');
    });

    // border-color
    borderColor_pickrjs = Pickr.create({
        el: '.pickrjs[data-property="border-color"]',
        theme: 'monolith',
        default: '#000000',
        defaultRepresentation: 'HEXA',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                clear: true,
                save: true,
                copy: true
            }
        }
    });

    borderColor_pickrjs.on('init', (instance) => {
        if ($('#border-color').val() == "transparent") {
            instance.setColor("transparent", true);
        } else {
            instance.setColor(instance.getColor().toHEXA().toString(), true);
            instance.setColor(rgbaToHex($('#border-color').val()), true);
            $('#border-color').val(instance._eventBindings[4][0].value)
        }
        instance.applyColor();
    });

    borderColor_pickrjs.on('save', (color) => {
        if (color == null) return;

        if (borderColor_pickrjs.getColorRepresentation() == "HEXA") {
            let selectedColor = borderColor_pickrjs.getSelectedColor().toHEXA().toString();
            if (selectedColor.length == 9 && selectedColor.slice(-2) == "00") {
                $('#border-color').val('transparent')
            } else {
                $('#border-color').val(selectedColor)
            }
        }

        if (borderColor_pickrjs.getColorRepresentation() == "RGBA") {
            let selectedColor = borderColor_pickrjs.getSelectedColor().toRGBA().toString(0);
            if (selectedColor.split(" ")[3].replace(")", "") == "0") {
                $('#border-color').val('transparent')
            } else {
                $('#border-color').val(selectedColor)
            }
        }

        if ($('#border-width').val() == "0px" || $('#border-style').val() == "none") {
            $('#border').val('none');
        } else {
            $('#border').val($('#border-width').val() + " " + $('#border-style').val() + " " + $('#border-color').val());
        }
    });

    borderColor_pickrjs.on('clear', () => {
        borderColor_pickrjs.setColor('rgba(0, 0, 0, 0)');
    });

    // outline-color
    outlineColor_pickrjs = Pickr.create({
        el: '.pickrjs[data-property="outline-color"]',
        theme: 'monolith',
        default: '#000000',
        defaultRepresentation: 'HEXA',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                clear: true,
                save: true,
                copy: true
            }
        }
    });

    outlineColor_pickrjs.on('init', (instance) => {
        if ($('#outline-color').val() == "transparent") {
            instance.setColor("transparent", true);
        } else {
            instance.setColor(instance.getColor().toHEXA().toString(), true);
            instance.setColor(rgbaToHex($('#outline-color').val()), true);
            $('#outline-color').val(instance._eventBindings[4][0].value)
        }
        instance.applyColor();
    });

    outlineColor_pickrjs.on('save', (color) => {
        if (color == null) return;

        if (outlineColor_pickrjs.getColorRepresentation() == "HEXA") {
            let selectedColor = outlineColor_pickrjs.getSelectedColor().toHEXA().toString();
            if (selectedColor.length == 9 && selectedColor.slice(-2) == "00") {
                $('#outline-color').val('transparent')
            } else {
                $('#outline-color').val(selectedColor)
            }
        }

        if (outlineColor_pickrjs.getColorRepresentation() == "RGBA") {
            let selectedColor = outlineColor_pickrjs.getSelectedColor().toRGBA().toString(0);
            if (selectedColor.split(" ")[3].replace(")", "") == "0") {
                $('#outline-color').val('transparent')
            } else {
                $('#outline-color').val(selectedColor)
            }
        }

        if ($('#outline-width').val() == "0px" || $('#outline-style').val() == "none") {
            $('#outline').val('none');
        } else {
            $('#outline').val($('#outline-width').val() + " " + $('#outline-style').val() + " " + $('#outline-color').val());
        }
    });

    outlineColor_pickrjs.on('clear', () => {
        outlineColor_pickrjs.setColor('rgba(0, 0, 0, 0)');
    });

    // background-color
    backgroundColor_pickrjs = Pickr.create({
        el: '.pickrjs[data-property="background-color"]',
        theme: 'monolith',
        default: '#000000',
        defaultRepresentation: 'HEXA',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                clear: true,
                save: true,
                copy: true
            }
        }
    });

    backgroundColor_pickrjs.on('init', (instance) => {
        if ($('#background-color').val() == "transparent") {
            instance.setColor("transparent", true);
        } else {
            instance.setColor(instance.getColor().toHEXA().toString(), true);
            instance.setColor(rgbaToHex($('#background-color').val()), true);
            $('#background-color').val(instance._eventBindings[4][0].value)
        }
        instance.applyColor();
    });

    backgroundColor_pickrjs.on('save', (color) => {
        if (color == null) return;

        if (backgroundColor_pickrjs.getColorRepresentation() == "HEXA") {
            let selectedColor = backgroundColor_pickrjs.getSelectedColor().toHEXA().toString();
            if (selectedColor.length == 9 && selectedColor.slice(-2) == "00") {
                $('#background-color').val('transparent')
            } else {
                $('#background-color').val(selectedColor)
            }
        }

        if (backgroundColor_pickrjs.getColorRepresentation() == "RGBA") {
            let selectedColor = backgroundColor_pickrjs.getSelectedColor().toRGBA().toString(0);
            if (selectedColor.split(" ")[3].replace(")", "") == "0") {
                $('#background-color').val('transparent')
            } else {
                $('#background-color').val(selectedColor)
            }
        }

    });

    backgroundColor_pickrjs.on('clear', () => {
        backgroundColor_pickrjs.setColor('rgba(0, 0, 0, 0)');
    });
}

function selectableInit() {
    $('.selectable').each(function () {
        if (!$(this).hasClass('initialized')) {

            $(this).find('input[type="text"]').on('click', function () {
                $(this).removeClass('error');
                let selectedValue = $(this).data('selectable-selected');
                var parent = $(this).parent();
                var container = $(this).parent().find('.selectables');
                var documentMouseUpHandler;

                if ($(this).parent().hasClass('open')) {
                    $(this).parent().removeClass('open')
                    $(this).parent().find('.selectables').fadeOut(0.3);

                    $(document).off('mouseup', documentMouseUpHandler);
                } else {
                    documentMouseUpHandler = function (e) {
                        if (!container.is(e.target) && container.has(e.target).length === 0) {
                            parent.removeClass('open');
                            container.fadeOut(0.3);

                            // Remove the event listener after it is triggered
                            $(document).off('mouseup', documentMouseUpHandler);
                        }
                    };


                    $(this).parent().find('.selectables .options li[data-selectable-value=' + selectedValue + ']').addClass('selected');

                    $(this).parent().addClass('open')
                    $(this).parent().find('.selectables').fadeIn(0.3);

                    let totalOptionsCount = $(this).parent().find('.selectables .options li').length;
                    let selectedEl = $(this).parent().find('.selectables .options li.selected').get(0);
                    let selectedIndex = $(this).parent().find('.selectables .options li[data-selectable-value=' + selectedValue + ']').index();

                    if (selectedIndex >= 3 && totalOptionsCount > 5) {
                        if (selectedIndex >= totalOptionsCount - 2) {
                            selectedIndex = 5 - (totalOptionsCount - selectedIndex);
                        } else {
                            selectedIndex = totalOptionsCount - (totalOptionsCount - 2);
                        }
                    }

                    let optionsToShift = totalOptionsCount - (totalOptionsCount - selectedIndex);
                    selectedEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    let optionHeight = $(this).parent().find('.selectables .options li').css('height');
                    let distanceToShiftTop = (optionsToShift * parseInt(optionHeight)) + 4;
                    $(this).parent().find('.selectables').css('top', "-" + distanceToShiftTop + "px");

                    $(document).on('mouseup', documentMouseUpHandler);
                }

            });

            $(document).off('click', '.option').on('click', '.option', function () {
                let clickedOptionValue = $(this).data('selectable-value');

                let inputElement = $(this).closest('.selectable').find('>input[type="text"]');

                inputElement.data('selectable-selected', clickedOptionValue);
                inputElement.attr('data-selectable-selected', clickedOptionValue);
                inputElement.val($(this).text());

                $(this).closest('.selectable').find('.selectables .options .option').removeClass('selected');
                $(this).addClass('selected');
                $(this).closest('.selectable').removeClass('open')
                $(this).closest('.selectable').find('.selectables').fadeOut(0.3);

                if (clickedOptionValue == "custom") {
                    if ($(this).closest('.selectable').find('.customOption').length == 0) {
                        $(this).closest('.selectable').prepend(`<div class='customOption'>
                            <a class="back">back</a>
                            <input type="text" class="custom-style-value-input" id="${inputElement.attr('id') + '_custom'}" data-property="${inputElement.attr('id') + '_custom'}"/>
                            <a class="enter">enter</a>
                        </div>`)

                        $('#' + inputElement.attr('id')).hide();


                        $('#' + inputElement.attr('id') + '_custom').focus();
                    } else {
                        $('#' + inputElement.attr('id')).hide();

                        $(this).closest('.selectable').find('.customOption').show();
                        $('#' + inputElement.attr('id') + '_custom').focus();
                    }
                }
            });

            $(document).on('click', '.customOption .back', function () {
                $(this).closest('.selectable').find('.customOption').hide();
                $(this).closest('.selectable').find('input').show();
                $(this).closest('.selectable').find('.selectables .options .option:first-child()').trigger('click')
            });

            $(document).off('blur', '.custom-style-value-input').on('blur', '.custom-style-value-input', function (e) {
                if ($(this).attr('id') == 'background-size_custom') {
                    if (isValidBackgroundSizeShortHand($(this).val())) {
                        $(this).removeClass('error');
                        let subProperties = splitBackgroundSizeShorthand($(this).val());

                        let x = y = 0;

                        switch (subProperties.length) {
                            case 1:
                                x = y = ifJustNumberAddPxUnit(subProperties[0]);
                                break;
                            case 2:
                                x = ifJustNumberAddPxUnit(subProperties[0]);
                                y = ifJustNumberAddPxUnit(subProperties[1]);
                                break;
                            default:
                                break;
                        }

                        if (x == y) {
                            $(this).val(x)
                        } else {
                            $(this).val(x + " " + y)
                        }

                        $(this).parent().parent().find('input').val($(this).val())

                        let field = property = $(this).parent().parent().find('>input').attr('id')
                        let selector = $(this).closest('.selectedItemCSSSelector').find('>.text-muted').text();
                        let value = $(this).val();

                        inputChangeDetected(field, selector, property, value)

                    } else {
                        $(this).addClass('error');
                    }
                }

                if ($(this).attr('id') == 'background-position_custom') {
                    if (isValidBackgroundPositionShortHand($(this).val())) {
                        $(this).removeClass('error');
                        let subProperties = splitBackgroundPositionShorthand($(this).val());

                        let x = y = 0;

                        switch (subProperties.length) {
                            case 1:
                                x = y = ifJustNumberAddPxUnit(subProperties[0]);
                                break;
                            case 2:
                                x = ifJustNumberAddPxUnit(subProperties[0]);
                                y = ifJustNumberAddPxUnit(subProperties[1]);
                                break;
                            default:
                                break;
                        }

                        if (x == y) {
                            $(this).val(x)
                        } else {
                            $(this).val(x + " " + y)
                        }

                        $(this).parent().parent().find('input').val($(this).val())

                        let field = property = $(this).parent().parent().find('>input').attr('id')
                        let selector = $(this).closest('.selectedItemCSSSelector').find('>.text-muted').text();
                        let value = $(this).val();

                        inputChangeDetected(field, selector, property, value)

                    } else {
                        $(this).addClass('error');
                    }
                }
            });

            $(document).on('input', '.custom-style-value-input', function (e) {
                $(this).removeClass('error');
            });

            $(this).addClass('initialized')
        }
    });
}

function shadowInit() {
    function updateShadow() {
        let x = $("#xOffset").val() + "px";
        let y = $("#yOffset").val() + "px";
        let blur = $("#blurRadius").val() + "px";
        let spread = $("#spreadRadius").val() + "px";
        let opacity = $("#opacity").val();
        let color = "#000000";
        let inset = $("#inset").is(":checked") ? "inset " : "";

        let rgbaColor = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
        let boxShadow = `${inset}${x} ${y} ${blur} ${spread} ${rgbaColor}`;

        $(".preview-box").css("box-shadow", boxShadow);
        $("#cssOutput").val(`box-shadow: ${boxShadow};`);
        $("#box-shadow").val(boxShadow);

    }

    $("#blurRadius").on("input", updateShadow);
    $("#spreadRadius").on("input", updateShadow);
    updateShadow();

    // $(".copy-btn").on("click", function () {
    //     $("#cssOutput").select();
    //     document.execCommand("copy");
    //     alert("CSS Copied!");
    // });

    // Drag UI for X & Y Offset
    let dragging = false;
    let offsetBox = $(".xy-offset-container");
    let handle = $(".xy-offset-handle");

    function updateXYValues(x, y) {
        $("#xOffset").val(x);
        $("#yOffset").val(y);
        updateShadow();
    }

    handle.on("mousedown", function (e) {
        dragging = true;
        e.preventDefault();
    });

    $(document).on("mousemove", function (e) {
        if (!dragging) return;

        let boxOffset = offsetBox.offset();
        let boxWidth = offsetBox.width();
        let boxHeight = offsetBox.height();
        let newX = e.pageX - boxOffset.left - boxWidth / 2;
        let newY = e.pageY - boxOffset.top - boxHeight / 2;

        newX = Math.max(-boxWidth / 2, Math.min(boxWidth / 2, newX));
        newY = Math.max(-boxHeight / 2, Math.min(boxHeight / 2, newY));

        handle.css({ left: newX + boxWidth / 2, top: newY + boxHeight / 2 });

        let xValue = Math.round((newX / (boxWidth / 2)) * 20); // Scale factor
        let yValue = Math.round((newY / (boxHeight / 2)) * 20);

        updateXYValues(xValue, yValue);
    });

    $(document).on("mouseup", function () {
        dragging = false;
    });

    // Sync inputs with draggable UI
    $("#xOffset, #yOffset").on("input change", function () {
        let x = parseInt($("#xOffset").val(), 10) || 0;
        let y = parseInt($("#yOffset").val(), 10) || 0;
        let boxWidth = offsetBox.width();
        let boxHeight = offsetBox.height();

        let newX = (x / 20) * (boxWidth / 2);
        let newY = (y / 20) * (boxHeight / 2);

        handle.css({ left: newX + boxWidth / 2, top: newY + boxHeight / 2 });
        updateShadow();
    });
}