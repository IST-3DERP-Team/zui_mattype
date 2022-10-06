sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    "sap/ui/Device",
    "sap/ui/table/library",
    "sap/m/TablePersoController"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, TablePersoController) {
        "use strict";

        var _this;
        var _startUpInfo;
        var _oCaption = {};

        // shortcut for sap.ui.table.SortOrder
        var SortOrder = library.SortOrder;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });

        return Controller.extend("zuimattype3.controller.Main", {
            
            onInit: function () {
                _this = this;
                this.showLoadingDialog("Loading...");

                var oModelStartUp= new sap.ui.model.json.JSONModel();
                oModelStartUp.loadData("/sap/bc/ui2/start_up").then(() => {
                    _startUpInfo = oModelStartUp.oData
                    // console.log(oModelStartUp.oData.id);
                    // console.log(oModelStartUp.oData);
                });

                this.enableDisableButton("matType", "disable");
                this.enableDisableButton("matClass", "disable");
                this.enableDisableButton("matAttrib", "disable");
                this.enableDisableButton("batchControl", "disable");

                this.getCaption();
                this.getSbuPlant();

                this._oGlobalMatTypeFilter = null;
                this._oSortDialog = null;
                this._oFilterDialog = null;
                this._oViewSettingsDialog = {};

                this._aEntitySet = {
                    matType: "MaterialTypeSet", matClass: "MaterialClsSet", matAttrib: "MaterialAttribSet", batchControl: "BatchControlSet"
                };

                this._aColumns = {};
                this._aSortableColumns = {};
                this._aFilterableColumns = {};

                this.getColumns();
                
                this._oDataBeforeChange = {};
                this._aInvalidValueState = [];

                // Add KeyUp event in MatTypeTab
                var oDelegateKeyUp = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    }
                  };
                this.byId("matTypeTab").addEventDelegate(oDelegateKeyUp);
            },

            getSbuPlant() {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/SBUPlantSet";

                oModel.read(oEntitySet, {
                    success: function (data, response) {
                        //console.log("getSbuPlant", data);

                        var aData = {results: []};
                        data.results.forEach(item => {
                            if (aData.results.filter(x => x.SBU == item.SBU).length == 0) {
                                aData.results.push(item);
                            }
                        })

                        var oJSONModelSbu = new JSONModel();
                        oJSONModelSbu.setData(aData);
                        _this.getView().setModel(oJSONModelSbu, "sbu");

                        _this.getView().setModel(new JSONModel({
                            activeSbu: "",
                            rowCountMatType: "0",
                            rowCountMatClass: "0",
                            rowCountMatAttrib: "0",
                            rowCountBatchControl: "0"
                        }), "ui");

                        _this.getSbuMatType();

                        // if (data && data.results.length == 1) {
                        //     var aItems = _this.getView().byId("cmbSbu").getItems();
                        //     var sDefaultItemId = aItems[0].getId();
                        //     var sDefaultItemKey = aItems[0].mProperties.key;
    
                        //     _this.getView().byId("cmbSbu").setSelectedItemId(sDefaultItemId);
    
                        //     _this.getView().setModel(new JSONModel({
                        //         activeSbu: sDefaultItemKey
                        //     }), "ui");
                        // }
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            getSbuMatType() {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/SBUSet";

                oModel.read(oEntitySet, {
                    success: function (data, response) {

                        // var aSbu = {results: []};
                        // data.results.forEach(item => {
                        //     if (aSbu.results.filter(x => x.Sbu == item.Sbu).length == 0)
                        //         aSbu.results.push({Sbu: item.Sbu});
                        // })

                        // var oJSONModelSbu = new JSONModel();
                        // oJSONModelSbu.setData(aSbu);
                        // _this.getView().setModel(oJSONModelSbu, "sbu");

                        var oJSONModelSbuMatType = new JSONModel();
                        oJSONModelSbuMatType.setData(data)
                        _this.getView().setModel(oJSONModelSbuMatType, "sbuMatType");

                        var sDefaultItemId = "";
                        var sDefaultItemKey = "";
                        var aItems = _this.getView().byId("cmbSbu").getItems();

                        if (aItems.length == 1) {
                            sDefaultItemId = aItems[0].getId();
                            sDefaultItemKey = aItems[0].mProperties.key;

                            _this.getView().byId("cmbSbu").setSelectedItemId(sDefaultItemId);
                            _this.getView().getModel("ui").setProperty("/activeSbu", sDefaultItemKey);

                            _this.getMatType();

                            _this.enableDisableButton("matType", "enable");
                            _this.enableDisableButton("matClass", "enable");
                            _this.enableDisableButton("matAttrib", "enable");
                            _this.enableDisableButton("batchControl", "enable");
                        }
                        // if (aItems.filter(x => x.mProperties.key == "VER").length > 0) {
                        //     sDefaultItemId = (aItems.filter(x => x.mProperties.key == "VER"))[0].getId();
                        //     sDefaultItemKey = (aItems.filter(x => x.mProperties.key == "VER"))[0].mProperties.key;
                        // } else {
                        //     sDefaultItemId = aItems[0].getId();
                        //     sDefaultItemKey = aItems[0].mProperties.key;
                        // }

                        // _this.getView().byId("cmbSbu").setSelectedItemId(sDefaultItemId);

                        // _this.getView().setModel(new JSONModel({
                        //     activeSbu: sDefaultItemKey
                        // }), "ui");

                        // _this.getMatType();
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            onSelectionChangeSbu(oEvent) {
                var sSelectedKey = this.getView().byId("cmbSbu").getSelectedKey();
                this.getView().getModel("ui").setProperty("/activeSbu", sSelectedKey);

                _this._aColumns["matType"].forEach(col => {
                    if (col.valueHelp.show == true && col.valueHelp.filter.length > 0) {
                        _this.getLookUpFilter(col);
                    }
                });

                this.getMatType();

                this.enableDisableButton("matType", "enable");
                this.enableDisableButton("matClass", "enable");
                this.enableDisableButton("matAttrib", "enable");
                this.enableDisableButton("batchControl", "enable");
            },

            getMatType() {
                _this.showLoadingDialog("Loading...");

                var activeSbu = this.getView().getModel("ui").getData().activeSbu;
                var aSbuMatType = this.getView().getModel("sbuMatType").getData();

                var oModel = this.getOwnerComponent().getModel();               
                oModel.read('/MaterialTypeViewSet', {
                    success: function (data, response) {

                        var aData = {results: []};
                        if (aSbuMatType && aSbuMatType.results.filter(x => x.Sbu == activeSbu).length > 0) {

                            var aSbuMatTypeFiltered = aSbuMatType.results.filter(
                                x => x.Sbu == activeSbu).map(
                                    item => { return item.FIELD2 });
                            
                            data.results.forEach(item => {
                                if (aSbuMatTypeFiltered.includes(item.MATTYP)) {
                                    aData.results.push(item);
                                }
                            });
                            
                            aData.results.forEach((item, index) => {
                                item.HASGMC = item.HASGMC === "X" ? true : false;
                                item.ISBATCH = item.ISBATCH === "X" ? true : false;
                                item.PRODOUT = item.PRODOUT === "X" ? true : false;
                                item.EXCIND = item.EXCIND === "X" ? true : false;
                                item.DELETED = item.DELETED === "X" ? true : false;

                                if (item.CREATEDDT !== null)
                                    item.CREATEDDT = dateFormat.format(item.CREATEDDT);

                                if (item.UPDATEDDT !== null)
                                    item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);

                                if (index === 0) {
                                    item.ACTIVE = true;
                                }
                                else {
                                    item.ACTIVE = false;
                                }
                            });

                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(aData);

                            _this.getView().getModel("ui").setProperty("/activeMatType", aData.results[0].MATTYP);

                            var aFilters = [];
                            if (_this.getView().byId("matTypeTab").getBinding("rows")) {
                                aFilters = _this.getView().byId("matTypeTab").getBinding("rows").aFilters;
                            }
                            var sFilterGlobal = _this.getView().byId("searchFieldMatType").getProperty("value");

                            _this.getView().setModel(oJSONModel, "matType");
                            _this.getView().getModel("ui").setProperty("/rowCountMatType", aData.results.length.toString());
                            _this.onRefreshFilter("matType", aFilters, sFilterGlobal);

                            if (aData.results.length > 0) {
                                setTimeout(() => {
                                    _this.setActiveRowColor("matTypeTab", 0);
                                }, 100)
                            }

                            _this.getMatClass();
                            _this.getBatchControl();
                        } else {
                            // Remove model of all table
                            _this.getView().getModel("matType").setProperty("/results", []);
                            _this.getView().getModel("matClass").setProperty("/results", []);
                            _this.getView().getModel("matAttrib").setProperty("/results", []);
                            _this.getView().getModel("batchControl").setProperty("/results", []);

                            _this.getView().getModel("ui").setProperty("/activeMatType", "");
                            _this.getView().getModel("ui").setProperty("/activeMatClass", "");
                            _this.getView().getModel("ui").setProperty("/activeMatClassSeq", "");
                        }

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            getMatClass() {
                
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialClsSet";
                var _this = this;
                var sMatType = this.getView().getModel("ui").getData().activeMatType;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATTYP eq '" + sMatType + "'"
                    },
                    success: function (data, response) {
                        data.results.sort((a, b) => {
                            return parseInt(a.SEQ) - parseInt(b.SEQ);
                        });

                        data.results.forEach((item, index) => {
                            item.GMCCLS = item.GMCCLS === "X" ? true : false;
                            item.ATTRIB = item.ATTRIB === "X" ? true : false;
                            item.INCLINDESC = item.INCLINDESC === "X" ? true : false;
                            item.DELETED = item.DELETED === "X" ? true : false;

                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = dateFormat.format(item.CREATEDDT);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("matClassTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("matClassTab").getBinding("rows").aFilters;
                        }
                        var sFilterGlobal = _this.getView().byId("searchFieldMatClass").getProperty("value");
                        
                        _this.getView().setModel(oJSONModel, "matClass");
                        _this.getView().getModel("ui").setProperty("/rowCountMatClass", data.results.length.toString());
                        _this.onRefreshFilter("matClass", aFilters, sFilterGlobal);

                        if (data.results.length > 0) {
                            setTimeout(() => {
                                _this.setActiveRowColor("matClassTab", 0);
                            }, 100)
                            
                            _this.getView().getModel("ui").setProperty("/activeMatClass", data.results[0].MATTYPCLS);
                            _this.getView().getModel("ui").setProperty("/activeMatClassSeq", data.results[0].SEQ);
                            _this.getMatAttrib();
                        }
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            getMatAttrib: function() {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialAttribSet";
                var _this = this;
                var sMatType = this.getView().getModel("ui").getData().activeMatType;
                var sMatClass = this.getView().getModel("ui").getData().activeMatClass;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATTYP eq '" + sMatType + "' and MATTYPCLS eq '" + sMatClass + "'"
                    },
                    success: function (data, response) {
                        data.results.sort((a,b) => (a.ATTRIBCD > b.ATTRIBCD ? 1 : -1));

                        data.results.forEach((item, index) => {
                            item.DELETED = item.DELETED === "X" ? true : false;

                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = dateFormat.format(item.CREATEDDT);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("matAttribTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("matAttribTab").getBinding("rows").aFilters;
                        }
                        var sFilterGlobal = _this.getView().byId("searchFieldMatAttrib").getProperty("value");

                        _this.getView().setModel(oJSONModel, "matAttrib");
                        _this.getView().getModel("ui").setProperty("/rowCountMatAttrib", data.results.length.toString());
                        _this.onRefreshFilter("matAttrib", aFilters, sFilterGlobal);
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            getBatchControl() {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/BatchControlSet";
                var _this = this;
                var sMatType = this.getView().getModel("ui").getData().activeMatType;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATTYP eq '" + sMatType + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            item.POCHK = item.POCHK === "X" ? true : false;
                            item.TPCHK = item.TPCHK === "X" ? true : false;
                            item.IDCHK = item.IDCHK === "X" ? true : false;
                            item.IDPOCHK = item.IDPOCHK === "X" ? true : false;
                            item.GRCHK = item.GRCHK === "X" ? true : false;
                            item.DELETED = item.DELETED === "X" ? true : false;

                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = dateFormat.format(item.CREATEDDT);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("batchControlTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("batchControlTab").getBinding("rows").aFilters;
                        }
                        var sFilterGlobal = _this.getView().byId("searchFieldBatchControl").getProperty("value");

                        _this.getView().setModel(oJSONModel, "batchControl");
                        _this.getView().getModel("ui").setProperty("/rowCountBatchControl", data.results.length.toString());
                        _this.onRefreshFilter("batchControl", aFilters, sFilterGlobal);
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            getColumns: async function() {
                var oModelColumns = new JSONModel();
                var sPath = jQuery.sap.getModulePath("zuimattype3", "/model/columns.json")
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                var oModel = this.getOwnerComponent().getModel();

                oModel.metadataLoaded().then(() => {
                    this.getDynamicColumns(oColumns, "MATTYPEMOD", "ZDV_MATTYPE");
                    
                    setTimeout(() => {
                        this.getDynamicColumns(oColumns, "MATCLASSMOD", "ZERP_MATTYPCLS");
                    }, 100);

                    setTimeout(() => {
                        this.getDynamicColumns(oColumns, "MATATTRIBMOD", "ZERP_MATTYPATRB");
                    }, 100);

                    setTimeout(() => {
                        this.getDynamicColumns(oColumns, "BATCHCTRLMOD", "ZERP_MTBC");
                    }, 100);
                })
            },

            getDynamicColumns(arg1, arg2, arg3) {
                var oColumns = arg1;
                var modCode = arg2;
                var tabName = arg3;

                //get dynamic columns based on saved layout or ZERP_CHECK
                var oJSONColumnsModel = new JSONModel();
                // this.oJSONModel = new JSONModel();
                var vSBU = "VER"; // this.getView().getModel("ui").getData().activeSbu;

                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                // console.log(oModel)
                oModel.setHeaders({
                    sbu: vSBU,
                    type: modCode,
                    tabname: tabName
                });
                
                oModel.read("/ColumnsSet", {
                    success: function (oData, oResponse) {
                        oJSONColumnsModel.setData(oData);
                        // _this.getView().setModel(oJSONColumnsModel, "columns"); //set the view model

                        if (oData.results.length > 0) {
                            // console.log(modCode)
                            if (modCode === 'MATTYPEMOD') {
                                var aColumns = _this.setTableColumns(oColumns["matType"], oData.results);                               
                                // console.log(aColumns);
                                _this._aColumns["matType"] = aColumns["columns"];
                                _this._aSortableColumns["matType"] = aColumns["sortableColumns"];
                                _this._aFilterableColumns["matType"] = aColumns["filterableColumns"]; 
                                _this.addColumns(_this.byId("matTypeTab"), aColumns["columns"], "matType");
                            }
                            else if (modCode === 'MATCLASSMOD') {
                                var aColumns = _this.setTableColumns(oColumns["matClass"], oData.results);
                                // console.log("aColumns", aColumns);
                                _this._aColumns["matClass"] = aColumns["columns"];
                                _this._aSortableColumns["matClass"] = aColumns["sortableColumns"];
                                _this._aFilterableColumns["matClass"] = aColumns["filterableColumns"];
                                _this.addColumns(_this.byId("matClassTab"), aColumns["columns"], "matClass");
                            }
                            else if (modCode === 'MATATTRIBMOD') {
                                var aColumns = _this.setTableColumns(oColumns["matAttrib"], oData.results);
                                // console.log("aColumns", aColumns);
                                _this._aColumns["matAttrib"] = aColumns["columns"];
                                _this._aSortableColumns["matAttrib"] = aColumns["sortableColumns"];
                                _this._aFilterableColumns["matAttrib"] = aColumns["filterableColumns"];
                                _this.addColumns(_this.byId("matAttribTab"), aColumns["columns"], "matAttrib");
                            }
                            else if (modCode === 'BATCHCTRLMOD') {
                                var aColumns = _this.setTableColumns(oColumns["batchControl"], oData.results);
                                // console.log("aColumns", aColumns);
                                _this._aColumns["batchControl"] = aColumns["columns"];
                                _this._aSortableColumns["batchControl"] = aColumns["sortableColumns"];
                                _this._aFilterableColumns["batchControl"] = aColumns["filterableColumns"];
                                _this.addColumns(_this.byId("batchControlTab"), aColumns["columns"], "batchControl");

                                _this.closeLoadingDialog();
                            }
                        }
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                });
            },

            setTableColumns: function(arg1, arg2) {
                var oColumn = arg1;
                var oMetadata = arg2;
                
                var aSortableColumns = [];
                var aFilterableColumns = [];
                var aColumns = [];

                oMetadata.forEach((prop, idx) => {
                    var vCreatable = prop.Creatable;
                    var vUpdatable = prop.Editable;
                    var vSortable = true;
                    var vSorted = prop.Sorted;
                    var vSortOrder = prop.SortOrder;
                    var vFilterable = true;
                    var vName = prop.ColumnLabel;
                    var oColumnLocalProp = oColumn.filter(col => col.name.toUpperCase() === prop.ColumnName);
                    var vShowable = true;
                    var vOrder = prop.Order;

                    // console.log(prop)
                    if (vShowable) {
                        //sortable
                        if (vSortable) {
                            aSortableColumns.push({
                                name: prop.ColumnName, 
                                label: vName, 
                                position: +vOrder, 
                                sorted: vSorted,
                                sortOrder: vSortOrder
                            });
                        }

                        //filterable
                        if (vFilterable) {
                            aFilterableColumns.push({
                                name: prop.ColumnName, 
                                label: vName, 
                                position: +vOrder,
                                value: "",
                                connector: "Contains"
                            });
                        }
                    }

                    //columns
                    aColumns.push({
                        name: prop.ColumnName, 
                        label: vName, 
                        position: +vOrder,
                        type: prop.DataType,
                        creatable: vCreatable,
                        updatable: vUpdatable,
                        sortable: vSortable,
                        filterable: vFilterable,
                        visible: prop.Visible,
                        required: prop.Mandatory,
                        width: prop.ColumnWidth + 'px',
                        sortIndicator: vSortOrder === '' ? "None" : vSortOrder,
                        hideOnChange: false,
                        valueHelp: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].valueHelp,
                        showable: vShowable,
                        key: prop.Key === '' ? false : true,
                        maxLength: prop.Length,
                        precision: prop.Decimal,
                        scale: prop.Scale !== undefined ? prop.Scale : null
                    })
                })

                aSortableColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                this.createViewSettingsDialog("sort", 
                    new JSONModel({
                        items: aSortableColumns,
                        rowCount: aSortableColumns.length,
                        activeRow: 0,
                        table: ""
                    })
                );

                aFilterableColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                this.createViewSettingsDialog("filter", 
                    new JSONModel({
                        items: aFilterableColumns,
                        rowCount: aFilterableColumns.length,
                        table: ""
                    })
                );

                aColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                var aColumnProp = aColumns.filter(item => item.showable === true);

                this.createViewSettingsDialog("column", 
                    new JSONModel({
                        items: aColumnProp,
                        rowCount: aColumnProp.length,
                        table: ""
                    })
                );

                
                return { columns: aColumns, sortableColumns: aSortableColumns, filterableColumns: aFilterableColumns };
            },

            addColumns(table, columns, model) {
                var aColumns = columns.filter(item => item.showable === true)
                aColumns.sort((a,b) => (a.position > b.position ? 1 : -1));

                aColumns.forEach(col => {
                    // console.log(col)
                    if (col.type === "STRING" || col.type === "DATETIME") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            // id: col.name,
                            width: col.width,
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"}),
                            visible: col.visible
                        }));
                    }
                    else if (col.type === "NUMBER") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "End",
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"}),
                            visible: col.visible
                        }));
                    }
                    else if (col.type === "BOOLEAN" ) {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "Center",
                            sortProperty: col.name,
                            filterProperty: col.name,                            
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.CheckBox({selected: "{" + model + ">" + col.name + "}", editable: false}),
                            visible: col.visible
                        }));
                    }
                })
            },

            getLookUpFilter(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var sEntitySet = arg.valueHelp.entitySet;
                var sNewModel = arg.valueHelp.items.path.substring(0, arg.valueHelp.items.path.indexOf(">"));
                var sFilter = arg.valueHelp.filter;

                if (arg.name == "MATTYP") {
                    var p1 = this.getView().getModel("ui").getProperty("/activeSbu");
                    sFilter = sFilter.replace("@P1", p1);
                }

                oModel.read(sEntitySet, {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        // console.log("getLookUpFilter", data, sNewModel);
                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);

                        _this.getView().setModel(oJSONModel, sNewModel);
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            onKeyUp(oEvent) {
                if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                    //this.byId("matTypeTab").setSelectedIndex(0);
                    var sRowId = this.byId(oEvent.srcControl.sId);
                    var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["matType"].sPath;
                    var oRow = this.getView().getModel("matType").getProperty(sRowPath);
                    var sMattyp = oRow.MATTYP;
                    this.getView().getModel("ui").setProperty("/activeMatType", sMattyp);

                    this.getMatClass();
                    this.getBatchControl();

                    // console.log("onkeyup", oEvent, this.byId("matTypeTab"), this.byId(oEvent.srcControl.sId));
                    // console.log(this.getView().getModel("matType").getProperty(this.byId(oEvent.srcControl.sId).oBindingContexts["matType"].sPath))
                }
            },

            onTableResize(arg1, arg2) {
                if (arg1 === "MatType") {
                    if (arg2 === "Max") {
                        //this.byId("fixFlexMatType").setProperty("fixContentSize", "99%");
                        this.byId("btnFullScreenMatType").setVisible(false);
                        this.byId("btnExitFullScreenMatType").setVisible(true);

                        this.getView().byId("matTypeTab").setVisible(true);
                        this.getView().byId("itbDetail").setVisible(false);
                    }
                    else {
                        //this.byId("fixFlexMatType").setProperty("fixContentSize", "50%");
                        this.byId("btnFullScreenMatType").setVisible(true);
                        this.byId("btnExitFullScreenMatType").setVisible(false);

                        this.getView().byId("matTypeTab").setVisible(true);
                        this.getView().byId("itbDetail").setVisible(true);
                    }
                }
                else {
                    if (arg2 === "Max") {
                        //this.byId("fixFlexMatType").setProperty("fixContentSize", "0%");
                        this.byId("btnFullScreenMatClass").setVisible(false);
                        this.byId("btnExitFullScreenMatClass").setVisible(true);
                        this.byId("btnFullScreenMatAttrib").setVisible(false);
                        this.byId("btnExitFullScreenMatAttrib").setVisible(true);
                        this.byId("btnFullScreenBatchControl").setVisible(false);
                        this.byId("btnExitFullScreenBatchControl").setVisible(true);

                        this.getView().byId("matTypeTab").setVisible(false);
                        this.getView().byId("itbDetail").setVisible(true);
                    }
                    else {
                        //this.byId("fixFlexMatType").setProperty("fixContentSize", "50%");
                        this.byId("btnFullScreenMatClass").setVisible(true);
                        this.byId("btnExitFullScreenMatClass").setVisible(false);
                        this.byId("btnFullScreenMatAttrib").setVisible(true);
                        this.byId("btnExitFullScreenMatAttrib").setVisible(false);
                        this.byId("btnFullScreenBatchControl").setVisible(true);
                        this.byId("btnExitFullScreenBatchControl").setVisible(false);

                        this.getView().byId("matTypeTab").setVisible(true);
                        this.getView().byId("itbDetail").setVisible(true);
                    }                    
                }
            },

            onCreateMatType() {
                this.byId("btnAddMatType").setVisible(false);
                this.byId("btnEditMatType").setVisible(false);
                this.byId("btnAddRowMatType").setVisible(true);
                this.byId("btnRemoveRowMatType").setVisible(true);
                this.byId("btnSaveMatType").setVisible(true);
                this.byId("btnCancelMatType").setVisible(true);
                this.byId("btnDeleteMatType").setVisible(false);
                this.byId("btnRefreshMatType").setVisible(false);
                this.byId("btnSortMatType").setVisible(false);
                this.byId("btnFilterMatType").setVisible(false);
                this.byId("btnFullScreenMatType").setVisible(false);
                this.byId("btnColPropMatType").setVisible(false);
                this.byId("searchFieldMatType").setVisible(false);
                this.onTableResize("MatType","Max");
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.byId("btnTabLayoutMatType").setVisible(false);

                this.byId("cmbSbu").setEnabled(false);

                this.setRowCreateMode("matType");
            },

            onCreateMatClass() {
                this.byId("btnAddMatClass").setVisible(false);
                this.byId("btnEditMatClass").setVisible(false);
                this.byId("btnAddRowMatClass").setVisible(true);
                this.byId("btnRemoveRowMatClass").setVisible(true);
                this.byId("btnSaveMatClass").setVisible(true);
                this.byId("btnCancelMatClass").setVisible(true);
                this.byId("btnDeleteMatClass").setVisible(false);
                this.byId("btnRefreshMatClass").setVisible(false);
                this.byId("btnSortMatClass").setVisible(false);
                this.byId("btnFilterMatClass").setVisible(false);
                this.byId("btnFullScreenMatClass").setVisible(false);
                this.byId("btnColPropMatClass").setVisible(false);
                this.byId("searchFieldMatClass").setVisible(false);
                this.onTableResize("MatClass","Max");
                this.byId("btnExitFullScreenMatClass").setVisible(false);
                this.byId("btnTabLayoutMatClass").setVisible(false);

                this.setRowCreateMode("matClass");
            },

            onCreateMatAttrib() {
                var sMatType = this.getView().getModel("ui").getData().activeMatType;
                var sMatClass = this.getView().getModel("ui").getData().activeMatClass;
                var sMatClassSeq = this.getView().getModel("ui").getData().activeMatClassSeq;
                
                var bAttrib = this.getView().getModel("matClass").getData().results.filter(
                    x => x.MATTYP == sMatType && x.MATTYPCLS == sMatClass && x.SEQ == sMatClassSeq)[0].ATTRIB;

                if (bAttrib) {
                    this.byId("btnAddMatAttrib").setVisible(false);
                    this.byId("btnEditMatAttrib").setVisible(false);
                    this.byId("btnAddRowMatAttrib").setVisible(true);
                    this.byId("btnRemoveRowMatAttrib").setVisible(true);
                    this.byId("btnSaveMatAttrib").setVisible(true);
                    this.byId("btnCancelMatAttrib").setVisible(true);
                    this.byId("btnDeleteMatAttrib").setVisible(false);
                    this.byId("btnRefreshMatAttrib").setVisible(false);
                    this.byId("btnSortMatAttrib").setVisible(false);
                    this.byId("btnFilterMatAttrib").setVisible(false);
                    this.byId("btnFullScreenMatAttrib").setVisible(false);
                    this.byId("btnColPropMatAttrib").setVisible(false);
                    this.byId("searchFieldMatAttrib").setVisible(false);
                    this.onTableResize("MatAttrib","Max");
                    this.byId("btnExitFullScreenMatAttrib").setVisible(false);
                    this.byId("btnTabLayoutMatAttrib").setVisible(false);

                    this.setRowCreateMode("matAttrib");
                } else {
                    MessageBox.warning(_oCaption.INFO_CREATE_DATA_NOT_ALLOW);
                }
            },

            onCreateBatchControl() {
                this.byId("btnAddBatchControl").setVisible(false);
                this.byId("btnEditBatchControl").setVisible(false);
                this.byId("btnAddRowBatchControl").setVisible(true);
                this.byId("btnRemoveRowBatchControl").setVisible(true);
                this.byId("btnSaveBatchControl").setVisible(true);
                this.byId("btnCancelBatchControl").setVisible(true);
                this.byId("btnDeleteBatchControl").setVisible(false);
                this.byId("btnRefreshBatchControl").setVisible(false);
                this.byId("btnSortBatchControl").setVisible(false);
                this.byId("btnFilterBatchControl").setVisible(false);
                this.byId("btnFullScreenBatchControl").setVisible(false);
                this.byId("btnColPropBatchControl").setVisible(false);
                this.byId("searchFieldBatchControl").setVisible(false);
                this.onTableResize("BatchControl","Max");
                this.byId("btnExitFullScreenBatchControl").setVisible(false);
                this.byId("btnTabLayoutBatchControl").setVisible(false);

                this.setRowCreateMode("batchControl");
            },

            setRowCreateMode(arg) {
                var aNewRows = this.getView().getModel(arg).getData().results.filter(item => item.NEW === true);
                if (aNewRows.length == 0) {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel(arg).getData());
                }

                var oNewRow = {};
                var oTable = this.byId(arg + "Tab");                
                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.creatable) {
                                if (ci.type === "BOOLEAN") {
                                    col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", 
                                        select: this.onCheckBoxChange.bind(this),    
                                        editable: true
                                    }));
                                }
                                else if (ci.valueHelp["show"]) {
                                    col.setTemplate(new sap.m.Input({
                                        type: "Text",
                                        value: "{" + arg + ">" + ci.name + "}",
                                        maxLength: +ci.maxLength,
                                        showValueHelp: true,
                                        valueHelpRequest: this.handleValueHelp.bind(this),
                                        showSuggestion: true,
                                        maxSuggestionWidth: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].maxSuggestionWidth : "1px",
                                        suggestionItems: {
                                            path: ci.valueHelp["suggestionItems"].path,
                                            length: 1000,
                                            template: new sap.ui.core.ListItem({
                                                key: ci.valueHelp["suggestionItems"].text,
                                                text: ci.valueHelp["suggestionItems"].text,
                                                additionalText: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].additionalText : '',
                                            }),
                                            templateShareable: false
                                        },
                                        change: this.onValueHelpLiveInputChange.bind(this)
                                    }));
                                }
                                else if (ci.type === "NUMBER") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'" + arg + ">" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                        liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }
                            } 

                            if (ci.required) {
                                col.getLabel().addStyleClass("requiredField");
                            }

                            if (ci.type === "STRING") oNewRow[ci.name] = "";
                            //else if (ci.type === "NUMBER") oNewRow[ci.name] = "0";
                            else if (ci.type === "BOOLEAN") oNewRow[ci.name] = false;
                        })
                }) 
                
                oNewRow["NEW"] = true;

                if (arg == "matClass") {
                    var iMaxSeq = 0;
                    var iMaxSeq1 = 0;
                    var iMaxSeq2 = 0;
                    
                    if (this._oDataBeforeChange.results.length > 0) {
                        iMaxSeq1 = Math.max(...this._oDataBeforeChange.results.map(item => item.SEQ));
                    }
                    
                    //var aNew = this.getView().getModel(pModel).getData();
                    if (aNewRows.length > 0) {
                        iMaxSeq2 = Math.max(...aNewRows.map(item => item.SEQ));
                    }
                    
                    iMaxSeq = (iMaxSeq1 > iMaxSeq2 ? iMaxSeq1 : iMaxSeq2) + 1;
                    oNewRow["SEQ"] = iMaxSeq.toString();
                } else if (arg == "matAttrib") {
                    var iMaxAttrib = 0;
                    var iMaxAttrib1 = 0;
                    var iMaxAttrib2 = 0;
                    
                    if (this._oDataBeforeChange.results.length > 0) {
                        iMaxAttrib1 = Math.max(...this._oDataBeforeChange.results.map(item => item.ATTRIBCD));
                    }
                    
                    //var aNew = this.getView().getModel(pModel).getData();
                    if (aNewRows.length > 0) {
                        iMaxAttrib2 = Math.max(...aNewRows.map(item => item.ATTRIBCD));
                    }
                    
                    iMaxAttrib = (iMaxAttrib1 > iMaxAttrib2 ? iMaxAttrib1 : iMaxAttrib2) + 1;
                    oNewRow["ATTRIBCD"] = iMaxAttrib.toString().padStart(7, "0");
                }

                aNewRows.push(oNewRow);
                this.getView().getModel(arg).setProperty("/results", aNewRows);
                
                // Remove filter
                this.byId(arg + "Tab").getBinding("rows").filter(null, "Application");
            },

            onEditMatType(oEvent) {
                var oTable = this.byId("matTypeTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }
                
                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })
                
                var aData = this.getView().getModel("matType").getData().results.filter(
                    (item, idx) => item.DELETED === false && aOrigSelIdx.indexOf(idx) != -1
                    );

                if (aData.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_DELETE_MODIFIED);
                    return;
                }

                this.byId("btnAddMatType").setVisible(false);
                this.byId("btnEditMatType").setVisible(false);
                this.byId("btnAddRowMatType").setVisible(false);
                this.byId("btnRemoveRowMatType").setVisible(false);
                this.byId("btnSaveMatType").setVisible(true);
                this.byId("btnCancelMatType").setVisible(true);
                this.byId("btnDeleteMatType").setVisible(false);
                this.byId("btnRefreshMatType").setVisible(false);
                this.byId("btnSortMatType").setVisible(false);
                this.byId("btnFilterMatType").setVisible(false);
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.byId("btnColPropMatType").setVisible(false);
                this.byId("searchFieldMatType").setVisible(false);
                this.onTableResize("MatType","Max");
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.byId("btnTabLayoutMatType").setVisible(false);

                this.byId("cmbSbu").setEnabled(false);

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matType").getData());

                //aData = this.getView().getModel("matType").getData().results.filter(item => item.DELETED === false);
                console.log("edit", aData);
                this.getView().getModel("matType").setProperty("/results", aData);

                this.setRowEditMode("matType");
            },

            onEditMatClass() {
                this.byId("btnAddMatClass").setVisible(false);
                this.byId("btnEditMatClass").setVisible(false);
                this.byId("btnAddRowMatClass").setVisible(false);
                this.byId("btnRemoveRowMatClass").setVisible(false);
                this.byId("btnSaveMatClass").setVisible(true);
                this.byId("btnCancelMatClass").setVisible(true);
                this.byId("btnDeleteMatClass").setVisible(false);
                this.byId("btnRefreshMatClass").setVisible(false);
                this.byId("btnSortMatClass").setVisible(false);
                this.byId("btnFilterMatClass").setVisible(false);
                this.byId("btnExitFullScreenMatClass").setVisible(false);
                this.byId("btnColPropMatClass").setVisible(false);
                this.byId("searchFieldMatClass").setVisible(false);
                this.onTableResize("MatClass","Max");
                this.byId("btnExitFullScreenMatClass").setVisible(false);
                this.byId("btnTabLayoutMatClass").setVisible(false);

                var oIconTabBar = this.byId("itbMatClass");
                oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey());

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matClass").getData());

                var aData = this.getView().getModel("matClass").getData().results.filter(item => item.DELETED === false);
                this.getView().getModel("matClass").setProperty("/results", aData);

                this.setRowEditMode("matClass");
            },

            onEditMatAttrib() {
                var oModel = this.getOwnerComponent().getModel();

                oModel.read("/GMCAttribSet", {
                    success: function(data, oResponse) {
                        var aData = _this.getView().getModel("matAttrib").getData().results.filter(item => item.DELETED === false);
                        console.log("onEditMatAttrib", aData.filter(x => x.MATTYPCLS == "ZFABC" && x.ATTRIBCD == "0000004"));
                        aData = aData.filter(x => data.results.filter(y => y.MATTYPCLS == x.MATTYPCLS && y.ATTRIBCD == x.ATTRIBCD).length == 0);
                        console.log("onEditMatAttrib2", aData.filter(x => x.MATTYPCLS == "ZFABC" && x.ATTRIBCD == "0000004"));

                        _this.byId("btnAddMatAttrib").setVisible(false);
                        _this.byId("btnEditMatAttrib").setVisible(false);
                        _this.byId("btnAddRowMatAttrib").setVisible(false);
                        _this.byId("btnRemoveRowMatAttrib").setVisible(false);
                        _this.byId("btnSaveMatAttrib").setVisible(true);
                        _this.byId("btnCancelMatAttrib").setVisible(true);
                        _this.byId("btnDeleteMatAttrib").setVisible(false);
                        _this.byId("btnRefreshMatAttrib").setVisible(false);
                        _this.byId("btnSortMatAttrib").setVisible(false);
                        _this.byId("btnFilterMatAttrib").setVisible(false);
                        _this.byId("btnExitFullScreenMatAttrib").setVisible(false);
                        _this.byId("btnColPropMatAttrib").setVisible(false);
                        _this.byId("searchFieldMatAttrib").setVisible(false);
                        _this.onTableResize("MatAttrib","Max");
                        _this.byId("btnExitFullScreenMatAttrib").setVisible(false);
                        _this.byId("btnTabLayoutMatAttrib").setVisible(false);

                        var oIconTabBar = _this.byId("itbMatClass");
                        oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey());
                        _this._oDataBeforeChange = jQuery.extend(true, {}, _this.getView().getModel("matAttrib").getData());
                        _this.getView().getModel("matAttrib").setProperty("/results", aData);
                        _this.setRowEditMode("matAttrib");
                    },
                    error: function(err) {
                        _this.closeLoadingDialog();
                    }
                });
            },

            onEditBatchControl() {
                this.byId("btnAddBatchControl").setVisible(false);
                this.byId("btnEditBatchControl").setVisible(false);
                this.byId("btnAddRowBatchControl").setVisible(false);
                this.byId("btnRemoveRowBatchControl").setVisible(false);
                this.byId("btnSaveBatchControl").setVisible(true);
                this.byId("btnCancelBatchControl").setVisible(true);
                this.byId("btnDeleteBatchControl").setVisible(false);
                this.byId("btnRefreshBatchControl").setVisible(false);
                this.byId("btnSortBatchControl").setVisible(false);
                this.byId("btnFilterBatchControl").setVisible(false);
                this.byId("btnExitFullScreenBatchControl").setVisible(false);
                this.byId("btnColPropBatchControl").setVisible(false);
                this.byId("searchFieldBatchControl").setVisible(false);
                this.onTableResize("BatchControl","Max");
                this.byId("btnExitFullScreenBatchControl").setVisible(false);
                this.byId("btnTabLayoutBatchControl").setVisible(false);

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey());

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("batchControl").getData());

                var aData = this.getView().getModel("batchControl").getData().results.filter(item => item.DELETED === false);
                this.getView().getModel("batchControl").setProperty("/results", aData);

                this.setRowEditMode("batchControl");
            },

            setRowEditMode(arg) {
                this.getView().getModel(arg).getData().results.forEach(item => item.Edited = false);

                var oTable = this.byId(arg + "Tab");

                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.updatable) {
                                if (ci.type === "BOOLEAN") {
                                    col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", 
                                        select: this.onCheckBoxChange.bind(this),    
                                        editable: true
                                    }));
                                }
                                else if (ci.valueHelp["show"]) {
                                    col.setTemplate(new sap.m.Input({
                                        // id: "ipt" + ci.name,
                                        type: "Text",
                                        value: "{" + arg + ">" + ci.name + "}",
                                        maxLength: +ci.maxLength,
                                        showValueHelp: true,
                                        valueHelpRequest: this.handleValueHelp.bind(this),
                                        showSuggestion: true,
                                        maxSuggestionWidth: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].maxSuggestionWidth : "1px",
                                        suggestionItems: {
                                            path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                            length: 1000,
                                            template: new sap.ui.core.ListItem({
                                                key: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}",
                                                text: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}", //ci.valueHelp["suggestionItems"].text
                                                additionalText: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].additionalText : '',
                                            }),
                                            templateShareable: false
                                        },
                                        change: this.onValueHelpLiveInputChange.bind(this)
                                    }));
                                }
                                else if (ci.type === "NUMBER") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'" + arg + ">" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                        liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }                                
                            }

                            if (ci.required) {
                                col.getLabel().addStyleClass("requiredField");
                            }
                        })
                })
            },

            onInputLiveChange: function(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;

                this.getView().getModel(sModel).setProperty(sRowPath + '/EDITED', true);
            },

            onNumberLiveChange: function(oEvent) {
                console.log(oEvent.getParameters())
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;

                this.getView().getModel(sModel).setProperty(sRowPath + '/EDITED', true);

                // console.log(oEvent.getParameters().value.split("."))

                // if (oEvent.getParameters().value.split(".")[1].length > 2) {
                //     console.log("not allowed")
                // }
            },

            onCancelMatType() {
                MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.byId("btnAddMatType").setVisible(true);
                            _this.byId("btnEditMatType").setVisible(true);
                            _this.byId("btnAddRowMatType").setVisible(false);
                            _this.byId("btnRemoveRowMatType").setVisible(false);
                            _this.byId("btnSaveMatType").setVisible(false);
                            _this.byId("btnCancelMatType").setVisible(false);
                            _this.byId("btnDeleteMatType").setVisible(true);
                            _this.byId("btnRefreshMatType").setVisible(true);
                            _this.byId("btnSortMatType").setVisible(true);
                            _this.byId("btnFilterMatType").setVisible(true);
                            _this.byId("btnFullScreenMatType").setVisible(true);
                            _this.byId("btnColPropMatType").setVisible(true);
                            _this.byId("searchFieldMatType").setVisible(true);
                            _this.byId("btnTabLayoutMatType").setVisible(true);

                            _this.byId("cmbSbu").setEnabled(true);

                            _this.onTableResize("MatType","Min");
                            _this.setRowReadMode("matType");
                            _this.getView().getModel("matType").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                            
                        }
                    }
                });
            },

            onCancelMatClass() {
                MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.byId("btnAddMatClass").setVisible(true);
                            _this.byId("btnEditMatClass").setVisible(true);
                            _this.byId("btnAddRowMatClass").setVisible(false);
                            _this.byId("btnRemoveRowMatClass").setVisible(false);
                            _this.byId("btnSaveMatClass").setVisible(false);
                            _this.byId("btnCancelMatClass").setVisible(false);
                            _this.byId("btnDeleteMatClass").setVisible(true);
                            _this.byId("btnRefreshMatClass").setVisible(true);
                            _this.byId("btnSortMatClass").setVisible(true);
                            _this.byId("btnFilterMatClass").setVisible(true);
                            _this.byId("btnFullScreenMatClass").setVisible(true);
                            _this.byId("btnColPropMatClass").setVisible(true);
                            _this.byId("searchFieldMatClass").setVisible(true);
                            _this.byId("btnTabLayoutMatClass").setVisible(true);
                            _this.onTableResize("MatClass","Min");
                            _this.setRowReadMode("matClass");
                            _this.getView().getModel("matClass").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                        }
                    }
                });
            },

            onCancelMatAttrib() {
                MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.byId("btnAddMatAttrib").setVisible(true);
                            _this.byId("btnEditMatAttrib").setVisible(true);
                            _this.byId("btnAddRowMatAttrib").setVisible(false);
                            _this.byId("btnRemoveRowMatAttrib").setVisible(false);
                            _this.byId("btnSaveMatAttrib").setVisible(false);
                            _this.byId("btnCancelMatAttrib").setVisible(false);
                            _this.byId("btnDeleteMatAttrib").setVisible(true);
                            _this.byId("btnRefreshMatAttrib").setVisible(true);
                            _this.byId("btnSortMatAttrib").setVisible(true);
                            _this.byId("btnFilterMatAttrib").setVisible(true);
                            _this.byId("btnFullScreenMatAttrib").setVisible(true);
                            _this.byId("btnColPropMatAttrib").setVisible(true);
                            _this.byId("searchFieldMatAttrib").setVisible(true);
                            _this.byId("btnTabLayoutMatAttrib").setVisible(true);
                            _this.onTableResize("MatAttrib","Min");
                            _this.setRowReadMode("matAttrib");
                            _this.getView().getModel("matAttrib").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                        }
                    }
                });
            },

            onCancelBatchControl() {
                MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.byId("btnAddBatchControl").setVisible(true);
                            _this.byId("btnEditBatchControl").setVisible(true);
                            _this.byId("btnAddRowBatchControl").setVisible(false);
                            _this.byId("btnRemoveRowBatchControl").setVisible(false);
                            _this.byId("btnSaveBatchControl").setVisible(false);
                            _this.byId("btnCancelBatchControl").setVisible(false);
                            _this.byId("btnDeleteBatchControl").setVisible(true);
                            _this.byId("btnRefreshBatchControl").setVisible(true);
                            _this.byId("btnSortBatchControl").setVisible(true);
                            _this.byId("btnFilterBatchControl").setVisible(true);
                            _this.byId("btnFullScreenBatchControl").setVisible(true);
                            _this.byId("btnColPropBatchControl").setVisible(true);
                            _this.byId("searchFieldBatchControl").setVisible(true);
                            _this.byId("btnTabLayoutBatchControl").setVisible(true);
                            _this.onTableResize("BatchControl","Min");
                            _this.setRowReadMode("batchControl");
                            _this.getView().getModel("batchControl").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                        }
                    }
                });
            },

            onAddRow(pModel) {
                this.setRowCreateMode(pModel);
            },

            onRemoveRow(pModel) {
                var oTable = this.byId(pModel + "Tab");
                var aNewRows = this.getView().getModel(pModel).getData().results.filter(item => item.NEW === true);
                aNewRows.splice(oTable.getSelectedIndices(), 1);
                console.log("onremoverow", aNewRows);
                this.getView().getModel(pModel).setProperty("/results", aNewRows);
            },

            onSave(arg) {
                _this.showLoadingDialog("Loading...");
          
                if (this._aInvalidValueState.length > 0) {
                    var bCompact = true;

                    MessageBox.error(_oCaption.INFO_INVALID_SAVE,
                        {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );
                    _this.closeLoadingDialog();
                    return;
                }

                var aNewRows = this.getView().getModel(arg).getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel(arg).getData().results.filter(item => item.EDITED === true);
                
                var aNewEditRows = aNewRows.length > 0 ? aNewRows : aEditedRows;

                // Validate Use GMC and GMC No. Range
                if (arg == "matType") {
                    var gmcValidate = aNewEditRows.filter(x => x.HASGMC && !x.GMCNRKEYCD);
                    if (gmcValidate.length > 0) {
                        var bCompact = true;
                        MessageBox.error(_oCaption.INFO_USE_GMC_REQ,
                            {
                                styleClass: bCompact ? "sapUiSizeCompact" : ""
                            }
                        );
                        _this.closeLoadingDialog();
                        return;
                    }
                } else if (arg == "matAttrib") {
                    if (this._oDataBeforeChange.results.length > 0) {
                        
                        // var descValidate = aNewEditRows.filter(
                        //     x => this._oDataBeforeChange.results.filter(
                        //         y => (y.SHORTTEXT.toUpperCase() == x.SHORTTEXT.toUpperCase() || 
                        //             y.SHORTTEXT2.toUpperCase() == x.SHORTTEXT2.toUpperCase())).length > 0);

                        var descValidate1 = aNewEditRows.filter(
                            x => this._oDataBeforeChange.results.filter(
                                y => (y.SHORTTEXT.toUpperCase() == x.SHORTTEXT.toUpperCase())).length > 0);
                    
                        var descValidate2 = aNewEditRows.filter(
                            x => this._oDataBeforeChange.results.filter(
                                y => (y.SHORTTEXT2.toUpperCase() == x.SHORTTEXT2.toUpperCase())).length > 0);

                        var descValidate3 = aNewEditRows.filter(
                            x => aNewEditRows.filter(
                                y => (!(y.MATTYP == x.MATTYP && y.MATTYPCLS == x.MATTYPCLS && y.ATTRIBCD == x.ATTRIBCD) && 
                                      y.SHORTTEXT.toUpperCase() == x.SHORTTEXT.toUpperCase())).length > 0);

                        var descValidate4 = aNewEditRows.filter(
                        x => aNewEditRows.filter(
                            y => (!(y.MATTYP == x.MATTYP && y.MATTYPCLS == x.MATTYPCLS && y.ATTRIBCD == x.ATTRIBCD) && 
                                    y.SHORTTEXT2.toUpperCase() == x.SHORTTEXT2.toUpperCase())).length > 0);

                        var desc = "";
                        if (descValidate1.length > 0) desc = descValidate1[0].SHORTTEXT;
                        else if (descValidate2.length > 0) desc = descValidate2[0].SHORTTEXT2;
                        else if (descValidate3.length > 0) desc = descValidate3[0].SHORTTEXT;
                        else if (descValidate4.length > 0) desc = descValidate4[0].SHORTTEXT2;

                        if (desc.length > 0) {
                            //MessageBox.error("\"Desc (EN)\" / \"Desc (CN)\" is already been used.");
                            MessageBox.error("\"" + desc + "\" " + _oCaption.INFO_ALREADY_EXIST);

                            _this.closeLoadingDialog();
                            return;
                        }
                    }
                    
                }
                
                // Validate required field if has value.
                var isValid = true;
                var sInvalidMsg = "";
                var aRequiredFields = this._aColumns[arg].filter(x => x.required).map(x => x.name);
                //console.log("onsave", aRequiredFields, aNewEditRows, this._aColumns[arg], this.getView().getModel(arg).getData())
                for (var i = 0; i < aRequiredFields.length; i++) {
                    var sRequiredField = aRequiredFields[i];
                    if (aNewEditRows.filter(x => !x[sRequiredField]).length > 0) {
                        isValid = false;
                        sInvalidMsg = "\"" + this._aColumns[arg].filter(x => x.name == sRequiredField)[0].label + "\" is required."
                        break;
                    }
                }

                if (!isValid) {
                    var bCompact = true;
                    MessageBox.error(sInvalidMsg,
                        {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );

                    _this.closeLoadingDialog();
                    return;
                }

                if (aNewRows.length > 0) {
                    var oModel = this.getOwnerComponent().getModel();
                    var iNew = 0;

                    aNewRows.forEach((item, idx) => {

                        var entitySet = "/" + this._aEntitySet[arg];
                        var param = {};

                        _this._aColumns[arg].forEach(col => {
                            if (col.creatable) {
                                var cellValue;

                                if (col.type == "BOOLEAN") {
                                    if (item[col.name]) cellValue = "X";
                                    else cellValue = "";
                                } else cellValue = item[col.name];

                                param[col.name] = cellValue;
                            }
                        })

                        if (arg != "matType") {
                            param["MATTYP"] = this.getView().getModel("ui").getData().activeMatType;
                        }

                        if (arg === "matClass") {
                            param["SEQ"] = item["SEQ"];
                        } else if (arg === "matAttrib") {
                            param["MATTYPCLS"] = this.getView().getModel("ui").getData().activeMatClass;
                            param["ATTRIBCD"] = item["ATTRIBCD"];
                        }

                        console.log("onsave", param);
                        setTimeout(() => {
                            oModel.create(entitySet, param, {
                                method: "POST",
                                success: function(data, oResponse) {
                                    console.log("success", oResponse)
                                    iNew++;

                                    if (iNew === aNewRows.length) {
                                        _this.setButton(arg, "Save");
                                    }

                                    _this._aInvalidValueState = [];
                                    _this.closeLoadingDialog();
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    var oError = JSON.parse(err.responseText);
                                    var sError = oError.error.message.value;

                                    MessageBox.error(sError,
                                    {
                                        styleClass: bCompact ? "sapUiSizeCompact" : ""
                                    });

                                    _this.closeLoadingDialog();
                                }
                            });
                        }, 500)
                    })
                }
                else if (aEditedRows.length > 0) {
                    var oModel = this.getOwnerComponent().getModel();
                    var iEdited = 0;
                    
                    aEditedRows.forEach((item,idx) => {
                        
                        var entitySet = "/" + this._aEntitySet[arg] + "(";
                        var param = {};

                        var iKeyCount = this._aColumns[arg].filter(col => col.key === true).length;

                        _this._aColumns[arg].forEach(col => {
                            if (col.updatable) {
                                if (!(arg == "matType" && col.name == "Desc")) {
                                    var cellValue;

                                    if (col.type == "BOOLEAN") {
                                        if (item[col.name]) cellValue = "X";
                                        else cellValue = "";
                                    } else cellValue = item[col.name];
    
                                    param[col.name] = cellValue;
                                }
                            } 

                            if (iKeyCount === 1) { 
                                if (col.key) entitySet += "'" + item[col.name] + "'" 
                            }
                            else if (iKeyCount > 1) { 
                                if (col.key) entitySet += col.name + "='" + item[col.name] + "',"
                            }
                        })

                        if (iKeyCount > 1) entitySet = entitySet.substr(0, entitySet.length - 1);

                        entitySet += ")";
 
                        console.log('onsave', entitySet, param)
                        
                        setTimeout(() => {
                            oModel.update(entitySet, param, {
                                method: "PUT",
                                success: function(data, oResponse) {
                                    iEdited++;

                                    if (iEdited === aEditedRows.length) {
                                        _this.setButton(arg, "Save");
                                    }

                                    _this._aInvalidValueState = [];
                                    _this.closeLoadingDialog();
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    var oError = JSON.parse(err.responseText);
                                    var sError = oError.error.message.value;

                                    MessageBox.error(sError,
                                    {
                                        styleClass: bCompact ? "sapUiSizeCompact" : ""
                                    });

                                    _this.closeLoadingDialog();
                                }
                            });
                        }, 500)
                    });
                }
                else {
                    var bCompact = true;

                    MessageBox.information(_oCaption.WARN_NO_DATA_MODIFIED,
                        {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );

                    _this.closeLoadingDialog();
                }
            },

            setButton(arg1, arg2) {
                if (arg2 === "Save") {
                    this.showHideButton(arg1, arg2);

                    this.setRowReadMode(arg1);
                    this.setReqColHdrColor(arg1);
                    //this.resetVisibleCols(arg1);

                    if (arg1 === "matType") this.onRefreshMatType();
                    else if (arg1 === "matClass") this.onRefreshMatClass();
                    else if (arg1 === "matAttrib") this.onRefreshMatAttrib();
                    else if (arg1 === "batchControl") this.onRefreshBatchControl();
                }
            },

            showHideButton(pTable, pAction) {
                if (pTable === "matType") pTable = "MatType";
                else if (pTable === "matClass") pTable = "MatClass";
                else if (pTable === "matAttrib") pTable = "MatAttrib";
                else if (pTable === "batchControl") pTable = "BatchControl";

                if (pAction == "Create" || pAction == "Edit") {                    
                    this.byId("btnAdd" + pTable).setVisible(false);
                    this.byId("btnEdit" + pTable).setVisible(false);
                    this.byId("btnAddRow" + pTable).setVisible(true);
                    this.byId("btnRemoveRow" + pTable).setVisible(true);
                    this.byId("btnSave" + pTable).setVisible(true);
                    this.byId("btnCancel" + pTable).setVisible(true);
                    this.byId("btnDelete" + pTable).setVisible(false);
                    this.byId("btnRefresh" + pTable).setVisible(false);
                    this.byId("btnSort" + pTable).setVisible(false);
                    this.byId("btnFilter" + pTable).setVisible(false);
                    this.byId("btnFullScreen" + pTable).setVisible(false);
                    this.byId("btnColProp" + pTable).setVisible(false);
                    this.byId("searchField" + pTable).setVisible(false);
                    this.onTableResize(pTable, "Max");
                    this.byId("btnExitFullScreen" + pTable).setVisible(false);
                    this.byId("btnTabLayout" + pTable).setVisible(false);

                } else if (pAction == "Save" || pAction == "Cancel") {
                    this.byId("btnAdd" + pTable).setVisible(true);
                    this.byId("btnEdit" + pTable).setVisible(true);
                    this.byId("btnAddRow" + pTable).setVisible(false);
                    this.byId("btnRemoveRow" + pTable).setVisible(false);
                    this.byId("btnSave" + pTable).setVisible(false);
                    this.byId("btnCancel" + pTable).setVisible(false);
                    this.byId("btnDelete" + pTable).setVisible(true);
                    this.byId("btnRefresh" + pTable).setVisible(true);
                    this.byId("btnSort" + pTable).setVisible(true);
                    this.byId("btnFilter" + pTable).setVisible(true);
                    this.byId("btnFullScreen" + pTable).setVisible(true);
                    this.byId("btnColProp" + pTable).setVisible(true);
                    this.byId("searchField" + pTable).setVisible(true);
                    this.onTableResize(pTable, "Min");
                    this.byId("btnExitFullScreen" + pTable).setVisible(false);
                    this.byId("btnTabLayout" + pTable).setVisible(false);
                }

                if (pTable == "MatType") {
                    this.byId("cmbSbu").setEnabled(true);
                }
            },

            enableDisableButton(pTable, pAction) {
                if (pTable === "matType") pTable = "MatType";
                else if (pTable === "matClass") pTable = "MatClass";
                else if (pTable === "matAttrib") pTable = "MatAttrib";
                else if (pTable === "batchControl") pTable = "BatchControl";

                if (pAction == "enable") {                    
                    this.byId("btnAdd" + pTable).setEnabled(true);
                    this.byId("btnEdit" + pTable).setEnabled(true);
                    this.byId("btnAddRow" + pTable).setEnabled(true);
                    this.byId("btnRemoveRow" + pTable).setEnabled(true);
                    this.byId("btnSave" + pTable).setEnabled(true);
                    this.byId("btnCancel" + pTable).setEnabled(true);
                    this.byId("btnDelete" + pTable).setEnabled(true);
                    this.byId("btnRefresh" + pTable).setEnabled(true);
                    this.byId("btnSort" + pTable).setEnabled(true);
                    this.byId("btnFilter" + pTable).setEnabled(true);
                    this.byId("btnFullScreen" + pTable).setEnabled(true);
                    this.byId("btnColProp" + pTable).setEnabled(true);
                    this.byId("searchField" + pTable).setEnabled(true);
                    this.byId("btnExitFullScreen" + pTable).setEnabled(true);
                    this.byId("btnTabLayout" + pTable).setEnabled(true);

                } else if (pAction == "disable") {
                    this.byId("btnAdd" + pTable).setEnabled(false);
                    this.byId("btnEdit" + pTable).setEnabled(false);
                    this.byId("btnAddRow" + pTable).setEnabled(false);
                    this.byId("btnRemoveRow" + pTable).setEnabled(false);
                    this.byId("btnSave" + pTable).setEnabled(false);
                    this.byId("btnCancel" + pTable).setEnabled(false);
                    this.byId("btnDelete" + pTable).setEnabled(false);
                    this.byId("btnRefresh" + pTable).setEnabled(false);
                    this.byId("btnSort" + pTable).setEnabled(false);
                    this.byId("btnFilter" + pTable).setEnabled(false);
                    this.byId("btnFullScreen" + pTable).setEnabled(false);
                    this.byId("btnColProp" + pTable).setEnabled(false);
                    this.byId("searchField" + pTable).setEnabled(false);
                    this.byId("btnExitFullScreen" + pTable).setEnabled(false);
                    this.byId("btnTabLayout" + pTable).setEnabled(false);
                }
            },

            onDeleteMatType() {
                this.onDelete("matType", "MaterialTypeSet");            
            },

            onDeleteMatClass() {
                this.onDelete("matClass", "MaterialClsSet");
            },

            onDeleteMatAttrib() {
                this.onDelete("matAttrib", "MaterialAttribSet");
            },

            onDeleteBatchControl() {
                this.onDelete("batchControl", "BatchControlSet");
            },

            onDelete(pModel, pEntity) {
                var oModel = this.getOwnerComponent().getModel();
                var oTable = this.byId(pModel + "Tab");
                var aSelRows = oTable.getSelectedIndices();
                
                if (aSelRows.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                }
                else {
                    MessageBox.confirm(_oCaption.INFO_PROCEED_DELETE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction === "Yes") {
                                aSelRows.forEach(rec => {
                                    var oContext = oTable.getContextByIndex(rec);
                                    var oModelContext = oContext.getModel();
                                    var sPath = oContext.getPath();

                                    var sParam = "";
                                    _this._aColumns[pModel].forEach(col => {
                                        if (col.key) {
                                            sParam += col.name + "='" + oContext.getObject()[col.name] + "',";
                                        }
                                    });

                                    sParam = sParam.slice(0, -1);
                                    var oEntitySet = "/" + pEntity + "(" + sParam + ")";
                                    var oParam = {
                                        "DELETED": "X"
                                    };
                                    console.log("delete", sParam, oParam)
                                    setTimeout(() => {
                                        oModel.update(oEntitySet, oParam, {
                                            method: "PUT",
                                            success: function(data, oResponse) {
                                                oModelContext.setProperty(sPath + '/DELETED', true);
                                            },
                                            error: function() {
                                                _this.closeLoadingDialog();
                                            }
                                        });
                                    }, 500)
                                });                            
                            }
                        }
                    });
                }
            },

            onRefreshMatType() {
                this.getMatType();
                // var oModel = this.getOwnerComponent().getModel();
                // var oJSONModel = new JSONModel();
                // var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
                // var _this = this;

                // oModel.read('/MaterialTypeSet', {
                //     success: function (data, response) {
                //         data.results.forEach((item, index) => {
                //             item.HASGMC = item.HASGMC === "X" ? true : false;
                //             item.ISBATCH = item.ISBATCH === "X" ? true : false;
                //             item.PRODOUT = item.PRODOUT === "X" ? true : false;
                //             item.EXCIND = item.EXCIND === "X" ? true : false;
                //             item.DELETED = item.DELETED === "X" ? true : false;

                //             if (item.CREATEDDT !== null)
                //                 item.CREATEDDT = dateFormat.format(item.CREATEDDT);

                //             if (item.UPDATEDDT !== null)
                //                 item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);
                                
                //             if (index === 0) {
                //                 item.ACTIVE = true;
                //             }
                //             else {
                //                 item.ACTIVE = false;
                //             }
                //         })

                //         oJSONModel.setData(data);
                        
                //         //var aFilters = _this.getView().byId("matTypeTab").getBinding("rows").aFilters;
                //         //console.log("aFilters",  aFilters, _this.getView().byId("matTypeTab").getBinding("rows"))
                //         _this.getView().setModel(oJSONModel, "matType");
                //         //console.log("aFilters2",  aFilters, _this.getView().byId("matTypeTab").getBinding("rows"))
                //         // _this.onRefreshFilter("matTypeTab", aFilters, "");
                //         //_this.getView().byId("matTypeTab").getBinding("rows").aFilters = aFilters;
                //         // _this.getView().byId("matTypeTab").getBinding("rows").applyFilter();

                //         // _this.getView().byId("matTypeTab").getBinding("rows").aFilters = _this.aFilterTest;
                //         // console.log("applyfilter3", _this.getView().byId("matTypeTab").getBinding("rows"))
                //         // _this.getView().byId("matTypeTab").getBinding("rows").applyFilter();

                //         setTimeout(() => {
                //             _this.getExpressionValue("matType", "Desc");
                //         }, 100);

                //         _this.getMatClass();
                //         _this.getBatchControl();

                        
                //         // _this.byId("matTypeTab").getBinding("rows").filter(oFilter, "Application");
                //         // var oTable = _this.getView().byId("matTypeTab");
                //         // oTable.getBinding("rows").applyFilter();
                        
                //     },
                //     error: function (err) {
                //     }
                // })
            },

            onRefreshFilter(pModel, pFilters, pFilterGlobal) {
                if (pFilters.length > 0) {
                    pFilters.forEach(item => {
                        var iColIdx = _this._aColumns[pModel].findIndex(x => x.name == item.sPath);
                        _this.getView().byId(pModel + "Tab").filter(_this.getView().byId(pModel + "Tab").getColumns()[iColIdx], 
                            item.oValue1);
                    });
                }

                if (pFilterGlobal.length > 0) {
                    var oTable =  _this.getView().byId(pModel + "Tab");
                    var sTable = oTable.getBindingInfo("rows").model;
                    var sQuery = pFilterGlobal;
                    var oFilter = null;
                    var aFilter = [];

                    if (sQuery) {
                        this._aFilterableColumns[sTable].forEach(item => {
                            var sDataType = this._aColumns[sTable].filter(col => col.name === item.name)[0].type;
                            if (sDataType === "BOOLEAN") aFilter.push(new Filter(item.name, FilterOperator.EQ, sQuery));
                            else aFilter.push(new Filter(item.name, FilterOperator.Contains, sQuery));
                        })

                        oFilter = new Filter(aFilter, false);
                    }
        
                    this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
                }
            },

            onRefreshMatClass() {
                this.getMatClass();
            },

            onRefreshMatAttrib() {
                this.getMatAttrib();
            },

            onRefreshBatchControl() {
                this.getBatchControl()
            },

            onColumnProp: function(oEvent) {
                var aColumns = [];
                var oTable = oEvent.getSource().oParent.oParent;
                
                oTable.getColumns().forEach(col => {
                    aColumns.push({
                        name: col.getProperty("sortProperty"), 
                        label: col.getLabel().getText(),
                        position: col.getIndex(), 
                        selected: col.getProperty("visible")
                    });
                })
                
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.ColumnDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aColumns);
                oDialog.getModel().setProperty("/rowCount", aColumns.length);
                oDialog.open();
            },

            beforeOpenColProp: function(oEvent) {
                oEvent.getSource().getModel().getData().items.forEach(item => {
                    if (item.selected) {
                        oEvent.getSource().getContent()[0].addSelectionInterval(item.position, item.position);
                    }
                    else {
                        oEvent.getSource().getContent()[0].removeSelectionInterval(item.position, item.position);
                    }
                })
            },            

            onColumnPropConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.ColumnDialog"];
                var oDialogTable = oDialog.getContent()[0];
                var aSelRows = oDialogTable.getSelectedIndices();

                if (aSelRows.length === 0) {
                    MessageBox.information(_oCaption.INFO_SEL_ONE_COL);
                }
                else {
                    oDialog.close();
                    var sTable = oDialog.getModel().getData().table;
                    var oTable = this.byId(sTable + "Tab");
                    var oColumns = oTable.getColumns();

                    oColumns.forEach(col => {
                        if (aSelRows.filter(item => item === col.getIndex()).length === 0) {
                            col.setVisible(false);
                        }
                        else col.setVisible(true);
                    })
                }
            },

            onColumnPropCancel: function(oEvent) {
                this._oViewSettingsDialog["zuimattype3.view.fragments.ColumnDialog"].close();
            },

            onSorted: function(oEvent) {
                var sColumnName = oEvent.getParameters().column.getProperty("sortProperty");
                var sSortOrder = oEvent.getParameters().sortOrder;
                var bMultiSort = oEvent.getParameters().columnAdded;
                var oSortData = this._aSortableColumns[oEvent.getSource().getBindingInfo("rows").model];

                if (!bMultiSort) {
                    oSortData.forEach(item => {
                        if (item.name === sColumnName) {
                            item.sorted = true;
                            item.sortOrder = sSortOrder;
                        }
                        else {
                            item.sorted = false;
                        } 
                    })
                }
            },

            onColSort: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;               
                var aSortableColumns = this._aSortableColumns[oTable.getBindingInfo("rows").model];

                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aSortableColumns);
                oDialog.getModel().setProperty("/rowCount", aSortableColumns.length);
                oDialog.open();
            },
            
            beforeOpenColSort: function(oEvent) {
                oEvent.getSource().getContent()[0].removeSelectionInterval(0, oEvent.getSource().getModel().getData().items.length - 1);
                oEvent.getSource().getModel().getData().items.forEach(item => {
                    if (item.sorted) {                       
                        oEvent.getSource().getContent()[0].addSelectionInterval(item.position, item.position);
                    }
                })
            },

            onColSortConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];
                oDialog.close();

                var sTable = oDialog.getModel().getData().table;
                var oTable = this.byId(sTable + "Tab");
                var oDialogData = oDialog.getModel().getData().items;
                var oDialogTable = oDialog.getContent()[0];
                var aSortSelRows = oDialogTable.getSelectedIndices();

                oDialogData.forEach(item => item.sorted = false);

                if (aSortSelRows.length > 0) {
                    oDialogData.forEach((item, idx) => {
                        if (aSortSelRows.filter(si => si === idx).length > 0) {
                            var oColumn = oTable.getColumns().filter(col => col.getProperty("sortProperty") === item.name)[0];
                            oTable.sort(oColumn, item.sortOrder === "Ascending" ? SortOrder.Ascending : SortOrder.Descending, true);
                            item.sorted = true;
                        }
                    })
                }

                this._aSortableColumns[sTable] = oDialogData;
            },

            onColSortCancel: function(oEvent) {
                this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"].close();
            },

            onColFilter: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent               
                var aFilterableColumns = this._aFilterableColumns[oTable.getBindingInfo("rows").model];

                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.FilterDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aFilterableColumns);
                oDialog.getModel().setProperty("/rowCount", aFilterableColumns.length);
                oDialog.open();
            },

            onColFilterConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.FilterDialog"];
                oDialog.close();

                var bFilter = false;
                var aFilter = [];
                var oFilter = null;
                var sTable = oDialog.getModel().getData().table;
                var oDialogData = oDialog.getModel().getData().items;

                oDialogData.forEach(item => {
                    if (item.value !== "") {
                        bFilter = true;
                        aFilter.push(new Filter(item.name, this.getConnector(item.connector), item.value))
                    }
                })
                
                if (bFilter) {
                    oFilter = new Filter(aFilter, true);
                    this.getView().byId("btnFilterMatType").addStyleClass("activeFiltering");
                }
                else {
                    oFilter = "";
                    this.getView().byId("btnFilterMatType").removeStyleClass("activeFiltering");
                }

                this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
                this._aFilterableColumns[sTable] = oDialogData;
            },

            onColFilterCancel: function(oEvent) {
                this._oViewSettingsDialog["zuimattype3.view.fragments.FilterDialog"].close();
            },

            onFilter(oEvent) {
                var oColumn = oEvent.getParameter("column");
                var sId = oColumn.sId;
                var sTable = sId.substring(0, sId.indexOf("Col", 0));
                var sColumn = sId.substring(sId.indexOf("Col", 0) + 3);

                var colProps = (this._aColumns[sTable].filter(x => x.name == sColumn))[0];
                if (colProps.type == "BOOLEAN") {
                    oEvent.preventDefault();

                    var sValue = oEvent.getParameter("value");
                    var oFilter;

                    if (!(sValue.toLowerCase() == "true" || sValue.toLowerCase() == "false")) {
                        var aFilter = [];
                        aFilter.push(new Filter(sColumn, FilterOperator.EQ, true));
                        aFilter.push(new Filter(sColumn, FilterOperator.EQ, false));
                        oFilter = new Filter(aFilter, false);
                    } else {
                        var bValue = (sValue.toLowerCase() == "true" ? true : false);
                        var boolFilter = new Filter(sColumn, FilterOperator.EQ, bValue);
                        oColumn.setFiltered(true);
                        //console.log("onfilter", oColumn, sTable, sColumn, boolFilter);
                        oFilter = boolFilter;
                    }

                    this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
                } else {
                    return;
                }
            },

            onCellClickMatType: function(oEvent) {
                var vMatType = oEvent.getParameters().rowBindingContext.getObject().MATTYP;
                this.getView().getModel("ui").setProperty("/activeMatType", vMatType);

                this.setActiveRowColor("matTypeTab", oEvent.getParameters().rowIndex);

                this.getMatClass();
                this.getBatchControl();

                // Clear Sort and Filter
                this.clearSortFilter("matClassTab");
                this.clearSortFilter("matAttribTab");
                this.clearSortFilter("batchControlTab");
            },

            clearSortFilter(pTable) {
                var oTable = this.byId(pTable);
                var oColumns = oTable.getColumns();
                for (var i = 0, l = oColumns.length; i < l; i++) {

                    if (oColumns[i].getFiltered()) {
                        oColumns[i].filter("");
                        // oColumns[i].setFilterValue("");;
                        // oColumns[i].setFiltered(false);
                    }

                    if (oColumns[i].getSorted()) {
                        oColumns[i].setSorted(false);
                    }
                }
            },

            onCellClickMatClass: function(oEvent) {
                var vMatClass = oEvent.getParameters().rowBindingContext.getObject().MATTYPCLS;
                var vMatClassSeq = oEvent.getParameters().rowBindingContext.getObject().SEQ;

                this.getView().getModel("ui").setProperty("/activeMatClass", vMatClass);
                this.getView().getModel("ui").setProperty("/activeMatClassSeq", vMatClassSeq);

                this.setActiveRowColor("matClassTab", oEvent.getParameters().rowIndex);

                this.getMatAttrib();
            },

            onCellClickMatAttrib(oEvent) {
                this.setActiveRowColor("matAttribTab", oEvent.getParameters().rowIndex);
            },

            onCellClickBatchControl(oEvent) {
                this.setActiveRowColor("batchControlTab", oEvent.getParameters().rowIndex);
            },

            setActiveRowColor(pTable, pRowIndex) {
                // console.log("setActiveRowColor", pTable, pRowIndex);
                // var oTable = this.getView().byId(pTable);
                // oTable.setSelectedIndex(pRowIndex);
                // var tableId = this.byId(pTable).getId();
                // $("#" + tableId + " .activeRow").removeClass("activeRow")
                // this.byId(pTable).getRows()[pRowIndex].addStyleClass("activeRow");
            },

            onTabSelect(oEvent) {
                this._selectedTabKey = oEvent.getParameters().selectedKey;
                setTimeout(() => {
                    this.setActiveRowColor(this._selectedTabKey + "Tab", 0);
                }, 100)
                
            },

            filterGlobally: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTable = oTable.getBindingInfo("rows").model;
                var sQuery = oEvent.getParameter("query");
                var oFilter = null;
                var aFilter = [];

                if (sQuery) {
                    this._aFilterableColumns[sTable].forEach(item => {
                        var sDataType = this._aColumns[sTable].filter(col => col.name === item.name)[0].type;
                        if (sDataType === "BOOLEAN") aFilter.push(new Filter(item.name, FilterOperator.EQ, sQuery));
                        else aFilter.push(new Filter(item.name, FilterOperator.Contains, sQuery));
                    })

                    oFilter = new Filter(aFilter, false);

                    // oFilter = new Filter([
                    //     new Filter("MatTyp", FilterOperator.Contains, sQuery),
                    //     new Filter("MATTYP", FilterOperator.Contains, sQuery)
                    // ], false);
                }
    
                this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
                console.log("filterGlobally", this.byId(sTable + "Tab").getBinding("rows"))
            },

            createViewSettingsDialog: function (arg1, arg2) {
                var sDialogFragmentName = null;

                if (arg1 === "sort") sDialogFragmentName = "zuimattype3.view.fragments.SortDialog";
                else if (arg1 === "filter") sDialogFragmentName = "zuimattype3.view.fragments.FilterDialog";
                else if (arg1 === "column") sDialogFragmentName = "zuimattype3.view.fragments.ColumnDialog";

                var oViewSettingsDialog = this._oViewSettingsDialog[sDialogFragmentName];

                if (!oViewSettingsDialog) {
                    oViewSettingsDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
                    
                    if (Device.system.desktop) {
                        oViewSettingsDialog.addStyleClass("sapUiSizeCompact");
                    }

                    oViewSettingsDialog.setModel(arg2);

                    this._oViewSettingsDialog[sDialogFragmentName] = oViewSettingsDialog;
                    this.getView().addDependent(oViewSettingsDialog);
                }
            },
            
            getConnector(args) {
                var oConnector;

                switch (args) {
                    case "EQ":
                        oConnector = sap.ui.model.FilterOperator.EQ
                        break;
                      case "Contains":
                        oConnector = sap.ui.model.FilterOperator.Contains
                        break;
                      default:
                        // code block
                        break;
                }

                return oConnector;
            },

            handleValueHelp: function(oEvent) {
                var oModel = this.getOwnerComponent().getModel();
                var oSource = oEvent.getSource();
                var sEntity = oSource.getBindingInfo("suggestionItems").path;
                var sModel = oSource.getBindingInfo("value").parts[0].model;

                this._inputId = oSource.getId();
                this._inputValue = oSource.getValue();
                this._inputSource = oSource;
                this._inputField = oSource.getBindingInfo("value").parts[0].path;

                if (sEntity.includes("/results")) {
                    var vCellPath = _this._inputField;
                    var vColProp = _this._aColumns[sModel].filter(item => item.name === vCellPath);
                    var vItemValue = vColProp[0].valueHelp.items.value;
                    var vItemDesc = vColProp[0].valueHelp.items.text;

                    var listModel = oSource.getBindingInfo("suggestionItems").model;
                    _this.getView().getModel(listModel).getData().results.forEach(item => {
                        item.VHTitle = item[vItemValue];
                        item.VHDesc = item[vItemDesc];
                        item.VHSelected = (item[vItemValue] === _this._inputValue);
                    });

                    if (!_this._valueHelpDialog) {
                    
                        _this._valueHelpDialog = sap.ui.xmlfragment(
                            "zuimattype3.view.fragments.ValueHelpDialog",
                            _this
                        );
    
                        _this._valueHelpDialog.setModel(
                            new JSONModel({
                                items: _this.getView().getModel(listModel).getData().results,
                                title: vColProp[0].label,
                                table: sModel
                            })
                        )
    
                        _this.getView().addDependent(_this._valueHelpDialog);
                    } else {
                        _this._valueHelpDialog.setModel(
                            new JSONModel({
                                items: _this.getView().getModel(listModel).getData().results,
                                title: vColProp[0].label,
                                table: sModel
                            })
                        )
    
                        _this.getView().addDependent(_this._valueHelpDialog); 
                    }
                    
                    _this._valueHelpDialog.open();  
                }
                else {
                    var vCellPath = _this._inputField;
                    var vColProp = _this._aColumns[sModel].filter(item => item.name === vCellPath);
                    var vItemValue = vColProp[0].valueHelp.items.value;
                    var vItemDesc = vColProp[0].valueHelp.items.text;

                    // var sPath = oSource.getParent().oBindingContexts[sModel].sPath;
                    // var rowModel = _this.getView().getModel("matType").getProperty(sPath);
                    var sFilter = "";
                    // if (vColProp[0].valueHelp.items.filter) {
                    //     sFilter = vColProp[0].valueHelp.items.filter;
                    //     var regex = new RegExp('@', 'g');
                    //     var iCount = (sFilter.match(regex) == null ? 0 : sFilter.match(regex).length);
                        
                    //     for (var i = 0; i < iCount; i++) {
                    //         for (var j = 0; j < iCount; j++) {
                    //             var colFilter = _this._aColumns[sModel][j].name;
                    //             if (sFilter.includes("@" + colFilter)) {
                    //                 sFilter = sFilter.replace("@" + colFilter, "'" + rowModel[colFilter] + "'");
                    //                 break;
                    //             }
                    //         }
                    //     }
                    // }

                    oModel.read(sEntity, {
                        urlParameters: {
                            "$filter": sFilter
                        },
                        success: function (data, response) {

                            data.results.forEach(item => {
                                item.VHTitle = item[vItemValue];
                                item.VHDesc = item[vItemDesc];
                                item.VHSelected = (item[vItemValue] === _this._inputValue);
                            });
   
                            // create value help dialog
                            if (!_this._valueHelpDialog) {
                                _this._valueHelpDialog = sap.ui.xmlfragment(
                                    "zuimattype3.view.fragments.ValueHelpDialog",
                                    _this
                                );

                                _this._valueHelpDialog.setModel(
                                    new JSONModel({
                                        items: data.results,
                                        title: vColProp[0].label,
                                        table: sModel
                                    })
                                )

                                _this.getView().addDependent(_this._valueHelpDialog);
                            }
                            else {
                                _this._valueHelpDialog.setModel(
                                    new JSONModel({
                                        items: data.results,
                                        title: vColProp[0].label,
                                        table: sModel
                                    })
                                )
                            }                            

                            _this._valueHelpDialog.open();
                        },
                        error: function (err) { 
                            _this.closeLoadingDialog();
                        }
                    })
                }
                
            },

            handleValueHelpSearch : function (oEvent) {
                var sValue = oEvent.getParameter("value");

                var oFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("VHTitle", sap.ui.model.FilterOperator.Contains, sValue),
                        new sap.ui.model.Filter("VHDesc", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });

                oEvent.getSource().getBinding("items").filter([oFilter]);
            },
    
            handleValueHelpClose : function (oEvent) {               
                if (oEvent.sId === "confirm") {                  
                    var oSelectedItem = oEvent.getParameter("selectedItem");               
                    //var sTable = this._oViewSettingsDialog["zuimattype3.view.fragments.ValueHelpDialog"].getModel().getData().table;
                    var sTable = this._valueHelpDialog.getModel().getData().table;

                    if (oSelectedItem) {
                        this._inputSource.setValue(oSelectedItem.getTitle());

                        if (this._inputId.indexOf("iptMattypcls") >= 0) {
                            this._valueHelpDialog.getModel().getData().results.filter(item => item.VHTitle === oSelectedItem.getTitle())
                                .forEach(item => {
                                    var oModel = this._inputSourceCtx.getModel();
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Descen', item.VHDesc);
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Desczh', item.VHDesc2);
                                })
                        }
    
                        if (this._inputValue !== oSelectedItem.getTitle()) {
                            var sRowPath = this._inputSource.getBindingInfo("value").binding.oContext.sPath;
                            this.getView().getModel(sTable).setProperty(sRowPath + '/EDITED', true);
                        }
                    }

                    this._inputSource.setValueState("None");
                    this.addRemoveValueState(true, this._inputSource.getId());
                }
                else if (oEvent.sId === "cancel") {
                    // console.log(oEvent.getSource().getBinding("items"));
                    // var source = oEvent.getSource().getBinding("items").oList;
                    // var data = source.filter(item => item.VHSelected === true);
                    // var value = "";

                    // if (data.length > 0) {
                    //     value = data[0].VHTitle;
                    // }

                    // this._inputSource.setValue(value);

                    // if (this._inputValue !== value) {
                    //     var data = this.byId("headerTable").getBinding("items").oList;                           
                    //     data.filter(item => item[this.inputField] === oSelectedItem.getTitle()).forEach(e => e.EDITED = true);
                    // }
                }
            },

            onValueHelpLiveInputChange: function(oEvent) {
                var oSource = oEvent.getSource();
                //console.log("onInputChange", oEvent, oSource)
                var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
                oSource.setValueState(isInvalid ? "Error" : "None");

                if (!oSource.getSelectedKey()) {
                    oSource.getSuggestionItems().forEach(item => {
                        // console.log(item.getProperty("key"), oSource.getValue().trim())
                        if (item.getProperty("key") === oSource.getValue().trim()) {
                            isInvalid = false;
                            oSource.setValueState(isInvalid ? "Error" : "None");
                        }
                    })
                }

                this.addRemoveValueState(!isInvalid, oSource.getId());

                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var sColumn = oSource.getBindingInfo("value").parts[0].path;
                this.getView().getModel(sModel).setProperty(sRowPath + '/' + sColumn, oSource.mProperties.selectedKey);
                this.getView().getModel(sModel).setProperty(sRowPath + '/EDITED', true);
            },

            onInputTextChange: function(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/EDITED', true);
                console.log("onInputChange2", sRowPath, oSource.getBindingInfo("value"), sModel, this.getView().getModel(sModel).getData())
                //console.log(oSource, oSource.getValueState(), oSource.getParent())
            },

            onCheckBoxChange: function(oEvent) {
                const oSource = oEvent.getSource();

                var sRowPath = oSource.getBindingInfo("selected").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("selected").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/EDITED', true);
                
                //console.log(oSource, sRowPath, sModel);
            },

            addRemoveValueState(pIsValid, pId) {
                console.log("addRemoveValueState", this._aInvalidValueState, pIsValid, pId)
                if (!pIsValid) {
                    if (!this._aInvalidValueState.includes(pId)) {
                        this._aInvalidValueState.push(pId);
                    }
                } else {
                    if (this._aInvalidValueState.includes(pId)) {
                        for(var i = this._aInvalidValueState.length - 1; i >= 0; i--) {
                            if (this._aInvalidValueState[i] == pId){
                                this._aInvalidValueState.splice(i, 1)
                            }
                            
                        }
                    }
                }
            },

            setRowReadMode(arg) {
                // var aSortedColumns = [];
                // if (arg == "matAttrib") {
                //     aSortedColumns.push(
                //         {model: "matAttrib", sortProperty: "ATTRIBCD", sorted: true, sortOrder: "Ascending"}
                //     );
                // }

                var oTable = this.byId(arg + "Tab");
                oTable.getColumns().forEach((col, idx) => {                    
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (ci.type === "STRING" || ci.type === "NUMBER") {
                                col.setTemplate(new sap.m.Text({
                                    text: "{" + arg + ">" + ci.name + "}",
                                    wrapping: false,
                                    tooltip: "{" + arg + ">" + ci.name + "}"
                                }));
                            }
                            else if (ci.type === "BOOLEAN") {
                                col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", editable: false}));
                            }

                            if (ci.required) {
                                col.getLabel().removeStyleClass("requiredField");
                            }
                        })
                    // // Sorting
                    // if (aSortedColumns.filter(x => x.model == arg && x.sortProperty == col.name).length > 0) {
                    //     console.log("setRowReadMode", col)
                    //     var oSortedColumn = aSortedColumns.filter(x => x.model == arg && x.sortProperty == col.name)[0];
                    //     col.sorted = oSortedColumn.sorted;
                    //     col.sortOrder = oSortedColumn.sortOrder;
                    // }    
                })

                // Reapply filter
                var aFilters = [];
                if (_this.getView().byId(arg + "Tab").getBinding("rows")) {
                    aFilters = _this.getView().byId(arg + "Tab").getBinding("rows").aFilters;
                }

                var sFilterGlobal = _this.getView().byId("searchField" + arg[0].toUpperCase() + arg.slice(1)).getProperty("value");
                _this.onRefreshFilter(arg, aFilters, sFilterGlobal);
            },

            setReqColHdrColor(arg) {
                var oTable = this.byId(arg + "Tab");

                oTable.getColumns().forEach((col, idx) => {
                    if (col.getLabel().getText().includes("*")) {
                        col.getLabel().setText(col.getLabel().getText().replaceAll("*", ""));
                    }   

                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (ci.required) {
                                col.getLabel().removeStyleClass("requiredField");
                            }
                        })
                })
            },

            resetVisibleCols(arg) {
                var aData = this.getView().getModel(arg).getData().results;
                console.log("resetVisibleCols", aData)
                this._oDataBeforeChange.results.forEach((item, idx) => {
                    console.log("test1", item)
                    if (item.DELETED) {
                        aData.splice(idx, 0, item)
                    }
                })

                //var aData = this._onData
                this.getView().getModel(arg).setProperty("/results", aData);
            },

            onColSortCellClick: function (oEvent) {
                this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"].getModel().setProperty("/activeRow", (oEvent.getParameters().rowIndex));
            },

            onColSortSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];               
                oDialog.getContent()[0].addSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onColSortDeSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];               
                oDialog.getContent()[0].removeSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onColSortRowFirst: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"].getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow)
                    .forEach(item => item.position = 0);
                oDialogData.filter((item, index) => index !== iActiveRow)
                    .forEach((item, index) => item.position = index + 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },

            onColSortRowUp: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow).forEach(item => item.position = iActiveRow - 1);
                oDialogData.filter((item, index) => index === iActiveRow - 1).forEach(item => item.position = item.position + 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },

            onColSortRowDown: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow).forEach(item => item.position = iActiveRow + 1);
                oDialogData.filter((item, index) => index === iActiveRow + 1).forEach(item => item.position = item.position - 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow + 1);
            },

            onColSortRowLast: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow)
                    .forEach(item => item.position = oDialogData.length - 1);
                    oDialogData.filter((item, index) => index !== iActiveRow)
                    .forEach((item, index) => item.position = index);
                    oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },

            onColPropSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.ColumnDialog"];               
                oDialog.getContent()[0].addSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onColPropDeSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.fragments.ColumnDialog"];               
                oDialog.getContent()[0].removeSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onRowSelectionChangeMatType: function(oEvent) {
                console.log("onRowSelectionChange", oEvent)
                // var indices = e.getParameter('rowIndices'); 
                // for (var i = 0; i < indices.length; i++) {
                //     var idx = indices[i];
                // }
            },

            showLoadingDialog(arg) {
                if (!_this._LoadingDialog) {
                    _this._LoadingDialog = sap.ui.xmlfragment("zuimattype3.view.fragments.LoadingDialog", _this);
                    _this.getView().addDependent(_this._LoadingDialog);
                } 
                // jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._LoadingDialog);
                
                _this._LoadingDialog.setTitle(arg);
                _this._LoadingDialog.open();
            },

            closeLoadingDialog() {
                _this._LoadingDialog.close();
            },

            onSaveTableLayout: function (oEvent) {
                //saving of the layout of table
                var me = this;
                var ctr = 1;
                var oTable = oEvent.getSource().oParent.oParent;
                // var oTable = this.getView().byId("mainTab");
                var oColumns = oTable.getColumns();
                var vSBU = this.getView().getModel("ui").getData().sbu;
                console.log(oColumns)

                // return;
                var oParam = {
                    "SBU": vSBU,
                    "TYPE": "",
                    "TABNAME": "",
                    "TableLayoutToItems": []
                };

                if (oTable.getBindingInfo("rows").model === "matType") {
                    oParam['TYPE'] = "MATTYPEMOD";
                    oParam['TABNAME'] = "ZDV_MATTYPE";
                }
                else if (oTable.getBindingInfo("rows").model === "matClass") {
                    oParam['TYPE'] = "MATCLASSMOD";
                    oParam['TABNAME'] = "ZERP_MATTYPCLS";
                }
                else if (oTable.getBindingInfo("rows").model === "matAttrib") {
                    oParam['TYPE'] = "MATATTRIBMOD";
                    oParam['TABNAME'] = "ZERP_MATTYPATRB";
                }
                else if (oTable.getBindingInfo("rows").model === "batchControl") {
                    oParam['TYPE'] = "BATCHCTRLMOD";
                    oParam['TABNAME'] = "ZERP_MTBC";
                }
                //console.log(oParam)
                //get information of columns, add to payload
                oColumns.forEach((column) => {
                    oParam.TableLayoutToItems.push({
                        // COLUMNNAME: column.sId,
                        COLUMNNAME: column.mProperties.sortProperty,
                        ORDER: ctr.toString(),
                        SORTED: column.mProperties.sorted,
                        SORTORDER: column.mProperties.sortOrder,
                        SORTSEQ: "1",
                        VISIBLE: column.mProperties.visible,
                        WIDTH: column.mProperties.width.replace('px','')
                    });

                    ctr++;
                });

                //call the layout save
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                oModel.create("/TableLayoutSet", oParam, {
                    method: "POST",
                    success: function(data, oResponse) {
                        sap.m.MessageBox.information(_oCaption.INFO_LAYOUT_SAVE);
                        //Common.showMessage(me._i18n.getText('t6'));
                    },
                    error: function(err) {
                        sap.m.MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });                
            },

            getCaption() {
                var oJSONModel = new JSONModel();
                var oDDTextParam = [];
                var oDDTextResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                
                // Label
                oDDTextParam.push({CODE: "SBU"});
                oDDTextParam.push({CODE: "MATTYPE"});
                oDDTextParam.push({CODE: "MATTYPCLS"});
                oDDTextParam.push({CODE: "MATTYPCLSF"});
                oDDTextParam.push({CODE: "MATATTRIB"});
                oDDTextParam.push({CODE: "BATCHCTRL"});
                oDDTextParam.push({CODE: "ROWS"});

                // MessageBox
                oDDTextParam.push({CODE: "INFO_NO_SELECTED"});
                oDDTextParam.push({CODE: "CONFIRM_DISREGARD_CHANGE"});
                oDDTextParam.push({CODE: "INFO_INVALID_SAVE"});
                oDDTextParam.push({CODE: "WARN_NO_DATA_MODIFIED"});
                oDDTextParam.push({CODE: "INFO_SEL_ONE_COL"});
                oDDTextParam.push({CODE: "INFO_LAYOUT_SAVE"});
                oDDTextParam.push({CODE: "INFO_CREATE_DATA_NOT_ALLOW"});
                oDDTextParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oDDTextParam.push({CODE: "INFO_NO_DELETE_MODIFIED"});
                oDDTextParam.push({CODE: "INFO_USE_GMC_REQ"});
                oDDTextParam.push({CODE: "INFO_ALREADY_EXIST"});
                oDDTextParam.push({CODE: "INFO_PROCEED_DELETE"});
                
                oModel.create("/CaptionMsgSet", { CaptionMsgItems: oDDTextParam  }, {
                    method: "POST",
                    success: function(oData, oResponse) {
                        // console.log(oData.CaptionMsgItems.results)
                        oData.CaptionMsgItems.results.forEach(item => {
                            oDDTextResult[item.CODE] = item.TEXT;
                        })

                        oJSONModel.setData(oDDTextResult);
                        _this.getView().setModel(oJSONModel, "ddtext");

                        _oCaption = _this.getView().getModel("ddtext").getData();
                    },
                    error: function(err) {
                        sap.m.MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });
            }
        });
    });
