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

        // shortcut for sap.ui.table.SortOrder
        var SortOrder = library.SortOrder;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });

        return Controller.extend("zuimattype3.controller.Main", {
            
            onInit: function () {
                _this = this;

                var oModelStartUp= new sap.ui.model.json.JSONModel();
                oModelStartUp.loadData("/sap/bc/ui2/start_up").then(() => {
                    _startUpInfo = oModelStartUp.oData
                    // console.log(oModelStartUp.oData.id);
                    // console.log(oModelStartUp.oData);
                });

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

                this.getColumnsConfig();
                this.getListValues();
                
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

            getColumnsConfig() {
                this._aColumnsSvc = [];
                
                // Material Type column config
                setTimeout(() => {
                    var oModelMatType = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                    oModelMatType.setHeaders({
                        sbu: 'VER',
                        type: 'MATTYPEMOD',
                        tabname: 'ZERP_MATTYP'
                    });

                    oModelMatType.read("/ColumnsSet", {
                        success: function (oData, oResponse) {
                            //console.log("ColumnsSet", oData);
                            _this._aColumnsSvc["matTypeCol"] = oData.results;
                            // var oJSONModel = new JSONModel();
                            // oJSONModel.setData(oData);
                            // _this.getView().setModel(oJSONModel, "matTypeCol")
                        },
                        error: function (err) { }
                    });
                }, 50);

                // Material Class column config
                setTimeout(() => {
                    var oModelMatClass = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                    oModelMatClass.setHeaders({
                        sbu: 'VER',
                        type: 'MATCLASSMOD',
                        tabname: 'ZERP_MATTYPCLS'
                    });

                    oModelMatClass.read("/ColumnsSet", {
                        success: function (oData, oResponse) {
                            //console.log("ColumnsSet", oData);
                            _this._aColumnsSvc["matClassCol"] = oData.results;
                            // var oJSONModel = new JSONModel();
                            // oJSONModel.setData(oData);
                            // _this.getView().setModel(oJSONModel, "matClassCol")
                        },
                        error: function (err) { }
                    });
                }, 50);

                // Material Attribute column config
                setTimeout(() => {
                    var oModelMatAttrib = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                    oModelMatAttrib.setHeaders({
                        sbu: 'VER',
                        type: 'MATATTRIBMOD',
                        tabname: 'ZERP_MATTYPATRB'
                    });

                    oModelMatAttrib.read("/ColumnsSet", {
                        success: function (oData, oResponse) {
                            //console.log("ColumnsSet", oData);
                            _this._aColumnsSvc["matAttribCol"] = oData.results;
                            // var oJSONModel = new JSONModel();
                            // oJSONModel.setData(oData);
                            // _this.getView().setModel(oJSONModel, "matAttribCol")
                        },
                        error: function (err) { }
                    });
                }, 50);

                // Batch Control column config
                setTimeout(() => {
                    var oModelBatchControl = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                    oModelBatchControl.setHeaders({
                        sbu: 'VER',
                        type: 'BATCHCTRLMOD',
                        tabname: 'ZERP_MTBC'
                    });

                    oModelBatchControl.read("/ColumnsSet", {
                        success: function (oData, oResponse) {
                            //console.log("ColumnsSet", oData);
                            _this._aColumnsSvc["batchControlCol"] = oData.results;
                            
                            _this.getColumns();
                            // var oJSONModel = new JSONModel();
                            // oJSONModel.setData(oData);
                            // _this.getView().setModel(oJSONModel, "batchControlCol")
                        },
                        error: function (err) { }
                    });
                }, 50);
            },

            getSbuPlant() {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/SBUPlantSet";

                oModel.read(oEntitySet, {
                    success: function (data, response) {
                        console.log("getSbuPlant", data);

                        var aData = {results: []};
                        data.results.forEach(item => {
                            if (aData.results.filter(x => x.Sbu == item.Sbu).length == 0) {
                                aData.results.push(item);
                            }
                        })

                        var oJSONModelSbu = new JSONModel();
                        oJSONModelSbu.setData(aData);
                        _this.getView().setModel(oJSONModelSbu, "sbu");

                        _this.getView().setModel(new JSONModel({
                            activeSbu: ""
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
                    error: function (err) { }
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
                    error: function (err) { }
                })
            },

            onSelectionChangeSbu(oEvent) {
                var sSelectedKey = this.getView().byId("cmbSbu").getSelectedKey();
                this.getView().getModel("ui").setProperty("/activeSbu", sSelectedKey);
                this.getMatType();
            },

            getMatType() {
                var activeSbu = this.getView().getModel("ui").getData().activeSbu;
                var aSbuMatType = this.getView().getModel("sbuMatType").getData();

                var oModel = this.getOwnerComponent().getModel();               
                oModel.read('/MaterialTypeSet', {
                    success: function (data, response) {

                        var aData = {results: []};
                        
                        if (aSbuMatType && aSbuMatType.results.filter(x => x.Sbu == activeSbu).length > 0) {

                            var aSbuMatTypeFiltered = aSbuMatType.results.filter(
                                x => x.Sbu == activeSbu).map(
                                    item => { return item.Field2 });
                            
                            data.results.forEach(item => {
                                if (aSbuMatTypeFiltered.includes(item.Mattyp)) {
                                    aData.results.push(item);
                                }
                            });
                            
                            aData.results.forEach((item, index) => {
                                item.Hasgmc = item.Hasgmc === "X" ? true : false;
                                item.Isbatch = item.Isbatch === "X" ? true : false;
                                item.Prodout = item.Prodout === "X" ? true : false;
                                item.Excind = item.Excind === "X" ? true : false;
                                item.Deleted = item.Deleted === "X" ? true : false;

                                if (item.Createddt !== null)
                                    item.Createddt = dateFormat.format(item.Createddt);

                                if (item.Updateddt !== null)
                                    item.Updateddt = dateFormat.format(item.Updateddt);

                                if (index === 0) {
                                    item.Active = true;
                                }
                                else {
                                    item.Active = false;
                                }
                            });

                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(aData);

                            _this.getView().getModel("ui").setProperty("/activeMatType", aData.results[0].Mattyp);

                            var aFilters = [];
                            if (_this.getView().byId("matTypeTab").getBinding("rows")) {
                                aFilters = _this.getView().byId("matTypeTab").getBinding("rows").aFilters;
                            }

                            _this.getView().setModel(oJSONModel, "matType");
                            _this.onRefreshFilter("matType", aFilters);
                            
                            setTimeout(() => {
                                _this.getExpressionValue("matType", "Desc");
                            }, 300);

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
                    },
                    error: function (err) { }
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
                        "$filter": "Mattyp eq '" + sMatType + "'"
                    },
                    success: function (data, response) {
                        data.results.sort((a, b) => {
                            return parseInt(a.Seq) - parseInt(b.Seq);
                        });

                        data.results.forEach((item, index) => {
                            item.Gmccls = item.Gmccls === "X" ? true : false;
                            item.Attrib = item.Attrib === "X" ? true : false;
                            item.Inclindesc = item.Inclindesc === "X" ? true : false;
                            item.Deleted = item.Deleted === "X" ? true : false;

                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("matClassTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("matClassTab").getBinding("rows").aFilters;
                        }

                        _this.getView().setModel(oJSONModel, "matClass");
                        _this.onRefreshFilter("matClass", aFilters);

                        if (data.results.length > 0) {
                            setTimeout(() => {
                                _this.setActiveRowColor("matClassTab", 0);
                            }, 100)
                            
                            _this.getView().getModel("ui").setProperty("/activeMatClass", data.results[0].Mattypcls);
                            _this.getView().getModel("ui").setProperty("/activeMatClassSeq", data.results[0].Seq);
                            _this.getMatAttrib();
                        }
                    },
                    error: function (err) { }
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
                        "$filter": "Mattyp eq '" + sMatType + "' and Mattypcls eq '" + sMatClass + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            item.Deleted = item.Deleted === "X" ? true : false;

                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("matAttribTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("matAttribTab").getBinding("rows").aFilters;
                        }

                        _this.getView().setModel(oJSONModel, "matAttrib");
                        _this.onRefreshFilter("matAttrib", aFilters);
                    },
                    error: function (err) { }
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
                        "$filter": "Mattyp eq '" + sMatType + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            item.Pochk = item.Pochk === "X" ? true : false;
                            item.Tpchk = item.Tpchk === "X" ? true : false;
                            item.Idchk = item.Idchk === "X" ? true : false;
                            item.Idpochk = item.Idpochk === "X" ? true : false;
                            item.Grchk = item.Grchk === "X" ? true : false;
                            item.Deleted = item.Deleted === "X" ? true : false;

                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("batchControlTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("batchControlTab").getBinding("rows").aFilters;
                        }

                        _this.getView().setModel(oJSONModel, "batchControl");
                        _this.onRefreshFilter("batchControl", aFilters);
                    },
                    error: function (err) { }
                })
            },

            getListValues: async function() {
                var oModelListValues = new JSONModel();
                var oJSONModel = new JSONModel();
                var sPath = jQuery.sap.getModulePath("zuimattype3", "/model/listValues.json")
                await oModelListValues.loadData(sPath);

                var keyList = Object.keys(oModelListValues.getData())
                keyList.forEach(key => {
                    oJSONModel.setData(oModelListValues.getData()[key])
                    this.getView().setModel(oJSONModel, key);
                })
            },

            getColumns: async function() {
                var oModelColumns = new JSONModel();
                var sPath = jQuery.sap.getModulePath("zuimattype3", "/model/columns.json")
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                var oModel = this.getOwnerComponent().getModel();

                oModel.metadataLoaded().then(() => {
                    var oService = oModel.getServiceMetadata().dataServices.schema.filter(item => item.namespace === "ZGW_3DERP_MATTYPE_SRV");
                    // console.log(oService)
                    var oMetadata = oService[0].entityType.filter(item => item.name === "MaterialType");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["matType"], oMetadata[0], "matType");
                        this._aColumns["matType"] = aColumns["columns"];
                        this._aSortableColumns["matType"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["matType"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("matTypeTab"), aColumns["columns"], "matType");
                    }

                    oMetadata = oService[0].entityType.filter(item => item.name === "MaterialCls");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["matClass"], oMetadata[0], "matClass");
                        this._aColumns["matClass"] = aColumns["columns"];
                        this._aSortableColumns["matClass"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["matClass"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("matClassTab"), aColumns["columns"], "matClass");
                    }

                    oMetadata = oService[0].entityType.filter(item => item.name === "MaterialAttrib");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["matAttrib"], oMetadata[0], "matAttrib");
                        this._aColumns["matAttrib"] = aColumns["columns"];
                        this._aSortableColumns["matAttrib"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["matAttrib"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("matAttribTab"), aColumns["columns"], "matAttrib");
                    }

                    oMetadata = oService[0].entityType.filter(item => item.name === "BatchControl");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["batchControl"], oMetadata[0], "batchControl");
                        this._aColumns["batchControl"] = aColumns["columns"];;
                        this._aSortableColumns["batchControl"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["batchControl"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("batchControlTab"), aColumns["columns"], "batchControl");
                    }

                    // console.log(this._aColumns)
                })
            },

            initColumns: function(arg1, arg2, arg3) {
                var oColumn = arg1;
                var oMetadata = arg2;
                var sModelName = arg3;
                
                var aSortableColumns = [];
                var aFilterableColumns = [];
                var aColumns = [];
                
                oMetadata.property.forEach((prop, idx) => {
                    var vCreatable = prop.extensions.filter(item => item.name === "creatable");
                    var vUpdatable = prop.extensions.filter(item => item.name === "updatable");
                    var vSortable = prop.extensions.filter(item => item.name === "sortable");
                    var vFilterable = prop.extensions.filter(item => item.name === "filterable");

                    var sLabel = _this._aColumnsSvc[sModelName + "Col"].filter(
                        x => x.ColumnName.toUpperCase() == prop.name.toUpperCase())[0].ColumnLabel;
                    var vName = sLabel; //prop.extensions.filter(item => item.name === "label")[0].value;
                    var oColumnLocalProp = oColumn.filter(col => col.name === prop.name);
                    var vShowable = oColumnLocalProp.length === 0 ? true :  oColumnLocalProp[0].showable;

                    if (vShowable) {
                        //sortable
                        if (vSortable.length === 0 || vSortable[0].value === "true") {
                            aSortableColumns.push({
                                name: prop.name, 
                                label: vName, 
                                position: oColumnLocalProp.length === 0 ? idx: oColumnLocalProp[0].position, 
                                sorted: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].sort === "" ? false : true,
                                sortOrder: oColumnLocalProp.length === 0 ? "" : oColumnLocalProp[0].sort
                            });
                        }

                        //filterable
                        if (vFilterable.length === 0 || vFilterable[0].value === "true") {
                            aFilterableColumns.push({
                                name: prop.name, 
                                label: vName, 
                                position: oColumnLocalProp.length === 0 ? idx : oColumnLocalProp[0].position,
                                value: "",
                                connector: "Contains"
                            });
                        }
                    }

                    //columns
                    aColumns.push({
                        name: prop.name, 
                        label: vName, 
                        position: oColumnLocalProp.length === 0 ? idx : oColumnLocalProp[0].position,
                        type: oColumnLocalProp.length === 0 ? prop.type : oColumnLocalProp[0].type,
                        creatable: vCreatable.length === 0 ? true : vCreatable[0].value === "true" ? true : false,
                        updatable: vUpdatable.length === 0 ? true : vUpdatable[0].value === "true" ? true : false,
                        sortable: vSortable.length === 0 ? true : vSortable[0].value === "true" ? true : false,
                        filterable: vFilterable.length === 0 ? true : vFilterable[0].value === "true" ? true : false,
                        visible: oColumnLocalProp.length === 0 ? true : oColumnLocalProp[0].visible,
                        required: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].required,
                        width: oColumnLocalProp.length === 0 ? "150px" : oColumnLocalProp[0].width,
                        sortIndicator: oColumnLocalProp.length === 0 ? "None" : oColumnLocalProp[0].sort,
                        hideOnChange: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].hideOnChange,
                        valueHelp: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].valueHelp,
                        expression: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].expression,
                        showable: oColumnLocalProp.length === 0 ? true : oColumnLocalProp[0].showable,
                        key: oMetadata.key.propertyRef.filter(item => item.name === prop.name).length === 0 ? false : true,
                        maxLength: prop.maxLength !== undefined ? prop.maxLength : null,
                        precision: prop.precision !== undefined ? prop.precision : null,
                        scale: prop.scale !== undefined ? prop.scale : null
                    })
                })

                // Columns in columns.json not included in metadata
                oColumn.forEach((prop, idx) => {
                    if (aColumns.filter(x => x.name == prop.name).length == 0) {
                        var vCreatable = prop.creatable;
                        var vUpdatable = prop.updatable;
                        var vSortable = prop.sortable;
                        var vFilterable = prop.filterable;
                        var vName = prop.label;
                        var oColumnLocalProp = oColumn.filter(col => col.name === prop.name);
                        var vShowable = oColumnLocalProp.length === 0 ? true :  oColumnLocalProp[0].showable;

                        if (vShowable) {
                            //sortable
                            if (vSortable) {
                                aSortableColumns.push({
                                    name: prop.name, 
                                    label: vName, 
                                    position: oColumnLocalProp.length === 0 ? idx: oColumnLocalProp[0].position, 
                                    sorted: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].sort === "" ? false : true,
                                    sortOrder: oColumnLocalProp.length === 0 ? "" : oColumnLocalProp[0].sort
                                });
                            }
    
                            //filterable
                            if (vFilterable) {
                                aFilterableColumns.push({
                                    name: prop.name, 
                                    label: vName, 
                                    position: oColumnLocalProp.length === 0 ? idx : oColumnLocalProp[0].position,
                                    value: "",
                                    connector: "Contains"
                                });
                            }
                        }

                        //columns
                        aColumns.push({
                            name: prop.name, 
                            label: vName, 
                            position: oColumnLocalProp.length === 0 ? idx : oColumnLocalProp[0].position,
                            type: oColumnLocalProp.length === 0 ? prop.type : oColumnLocalProp[0].type,
                            creatable: vCreatable,
                            updatable: vUpdatable,
                            sortable: vSortable,
                            filterable: vFilterable,
                            visible: oColumnLocalProp.length === 0 ? true : oColumnLocalProp[0].visible,
                            required: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].required,
                            width: oColumnLocalProp.length === 0 ? "150px" : oColumnLocalProp[0].width,
                            sortIndicator: oColumnLocalProp.length === 0 ? "None" : oColumnLocalProp[0].sort,
                            hideOnChange: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].hideOnChange,
                            valueHelp: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].valueHelp,
                            expression: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].expression,
                            showable: oColumnLocalProp.length === 0 ? true : oColumnLocalProp[0].showable,
                            key: false,
                            maxLength: null,
                            precision: null,
                            scale: null
                        })
                    }
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

            onAddColumns(table, columns, model) {
                var aColumns = columns.filter(item => item.showable === true)

                aColumns.forEach(col => {
                    if (col.type === "Edm.String") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"})
                        }));
                    }
                    else if (col.type === "Edm.Decimal") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "End",
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"})
                        }));
                    }
                    else if (col.type === "Edm.Boolean" ) {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "Center",
                            sortProperty: col.name,
                            filterProperty: col.name,                            
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.CheckBox({selected: "{" + model + ">" + col.name + "}", editable: false})
                        }));
                    }
                })
            },

            onKeyUp(oEvent) {
                if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                    //this.byId("matTypeTab").setSelectedIndex(0);
                    var sRowId = this.byId(oEvent.srcControl.sId);
                    var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["matType"].sPath;
                    var oRow = this.getView().getModel("matType").getProperty(sRowPath);
                    var sMattyp = oRow.Mattyp;
                    this.getView().getModel("ui").setProperty("/activeMatType", sMattyp);

                    this.getMatClass();
                    this.getBatchControl();

                    // console.log("onkeyup", oEvent, this.byId("matTypeTab"), this.byId(oEvent.srcControl.sId));
                    // console.log(this.getView().getModel("matType").getProperty(this.byId(oEvent.srcControl.sId).oBindingContexts["matType"].sPath))
                }
            },

            getExpressionValue(pModel, pName) {
                var oModel = this.getOwnerComponent().getModel();
                var oColumn = this._aColumns[pModel].filter(x => x.name == pName)[0];
                
                this.getView().getModel(pModel).getProperty("/results").forEach(item => {
                    var sFilter = oColumn.expression.filter;

                    //sFilter = sFilter.replace("@Language", "'" + _startUpInfo.language.substr(0, 1) + "'");

                    var regex = new RegExp('@', 'g');
                    var iCount = sFilter.match(regex).length;

                    for (var i = 0; i < iCount; i++) {
                        for (var j = 0; j < _this._aColumns[pModel].length; j++) {
                            var colFilter = _this._aColumns[pModel][j].name;
                            
                            if (sFilter.includes("@" + colFilter)) {
                                sFilter = sFilter.replace("@" + colFilter, "'" + item[colFilter] + "'");
                                break;
                            }
                        }
                    }

                    oModel.read(oColumn.expression.path, {
                        urlParameters: {
                            "$filter": sFilter
                        },
                        success: function (data, response) {
                            if (data.results.length > 0) {
                                if (data.results.length > 0) {
                                    if (pName == "Desc") {
                                        var index = _this.getView().getModel(pModel).getProperty("/results").findIndex(x => x.Mattyp == data.results[0].Mtart)
                                        _this.getView().getModel(pModel).setProperty("/results/" + index + "/Desc", data.results[0].Mtbez);
                                    }
                                }
                            }
                        },
                        error: function (err) { }
                    });
                })
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

                this.onCreate("matTypeTab", "matType");
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

                this.onCreate("matClassTab", "matClass");
            },

            onCreateMatAttrib() {
                var sMatType = this.getView().getModel("ui").getData().activeMatType;
                var sMatClass = this.getView().getModel("ui").getData().activeMatClass;
                var sMatClassSeq = this.getView().getModel("ui").getData().activeMatClassSeq;
                
                var bAttrib = this.getView().getModel("matClass").getData().results.filter(
                    x => x.Mattyp == sMatType && x.Mattypcls == sMatClass && x.Seq == sMatClassSeq)[0].Attrib;

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

                    this.onCreate("matAttribTab", "matAttrib");
                } else {
                    MessageBox.warning("Data creation is not allowed.");
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

                this.onCreate("batchControlTab", "batchControl");
            },

            onCreate(pTable, pModel) {
                var aNewRows = this.getView().getModel(pModel).getData().results.filter(item => item.New === true);
                if (aNewRows.length == 0) {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel(pModel).getData());
                }

                //var aNewRow = [];
                var oNewRow = {};
                var oTable = this.byId(pTable);                
                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns[pModel].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.creatable) {
                                if (ci.type === "Edm.Boolean") {
                                    col.setTemplate(new sap.m.CheckBox({selected: "{" + pModel + ">" + ci.name + "}", editable: true}));
                                }
                                else if (ci.valueHelp["show"]) {
                                    if (ci.valueHelp["items"].path.includes("results")) {
                                        col.setTemplate(new sap.m.Input({
                                            // id: "ipt" + ci.name,
                                            type: "Text",
                                            value: "{" + pModel + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            showValueHelp: true,
                                            valueHelpRequest: this.handleValueHelp.bind(this),
                                            showSuggestion: true,
                                            suggestionItems: {
                                                path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                                length: 1000,
                                                template: new sap.ui.core.Item({
                                                    key: "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].value + "}",
                                                    text: (!ci.valueHelp.suggestionItems.showSecondaryValue ?
                                                        "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].value + "}" :
                                                        "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].value + "}"  + "  -  (" + 
                                                        "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].text + "})")
                                                }),
                                                templateShareable: false
                                            },
                                            maxSuggestionWidth: "340px",
                                            change: this.onInputChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            // id: "ipt" + ci.name,
                                            type: "Text",
                                            value: "{" + pModel + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            showValueHelp: true,
                                            valueHelpRequest: this.handleValueHelp.bind(this),
                                            showSuggestion: true,
                                            suggestionItems: {
                                                path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                                length: 1000,
                                                template: new sap.ui.core.Item({
                                                    key: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}",
                                                    text: (!ci.valueHelp.suggestionItems.showSecondaryValue ?
                                                        "{" + ci.valueHelp["items"].value + "}" :
                                                        "{" + ci.valueHelp["items"].value + "}" + "  -  (" + "{" + ci.valueHelp["items"].text + "})"
                                                        )//"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}", //ci.valueHelp["suggestionItems"].text
                                                }),
                                                templateShareable: false
                                            },
                                            maxSuggestionWidth: "270px",
                                            change: this.onInputChange.bind(this)
                                        }));
                                    }
                                }
                                else if (ci.type === "Edm.Decimal" || ci.type === "Edm.Double" || ci.type === "Edm.Float" || ci.type === "Edm.Int16" || ci.type === "Edm.Int32" || ci.type === "Edm.Int64" || ci.type === "Edm.SByte" || ci.type === "Edm.Single") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        value: "{" + pModel + ">" + ci.name + "}",
                                        liveChange: this.onNumberLiveChange
                                        // change: this.onInputChange.bind(this)
                                    }));
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + pModel + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            //liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + pModel + ">" + ci.name + "}",
                                            //liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }
                            } 

                            if (ci.required) {
                                col.getLabel().setText(col.getLabel().getText() + "*");
                                col.getLabel().addStyleClass("requiredField");
                                
                            }

                            if (ci.type === "Edm.String") oNewRow[ci.name] = "";
                            else if (ci.type === "Edm.Decimal") oNewRow[ci.name] = 0;
                            else if (ci.type === "Edm.Boolean") oNewRow[ci.name] = false;
                        })
                }) 
                
                oNewRow["New"] = true;

                if (pModel == "matAttrib") {
                    var iMaxAttrib = 0;
                    var iMaxAttrib1 = 0;
                    var iMaxAttrib2 = 0;
                    
                    if (this._oDataBeforeChange.results.length > 0) {
                        iMaxAttrib1 = Math.max(...this._oDataBeforeChange.results.map(item => item.Attribcd));
                    }
                    
                    //var aNew = this.getView().getModel(pModel).getData();
                    if (aNewRows.length > 0) {
                        iMaxAttrib2 = Math.max(...aNewRows.map(item => item.Attribcd));
                    }
                    
                    iMaxAttrib = (iMaxAttrib1 > iMaxAttrib2 ? iMaxAttrib1 : iMaxAttrib2) + 1;
                    oNewRow["Attribcd"] = iMaxAttrib.toString().padStart(7, "0");
                }

                aNewRows.push(oNewRow);
                //console.log("new row", aNewRows)
                this.getView().getModel(pModel).setProperty("/results", aNewRows);
            },

            onEditMatType(oEvent) {
                var oTable = this.byId("matTypeTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information("No record(s) have been selected for editing.");
                    return;
                }
                
                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })
                
                var aData = this.getView().getModel("matType").getData().results.filter(
                    (item, idx) => item.Deleted === false && aOrigSelIdx.indexOf(idx) != -1
                    );

                if (aData.length === 0) {
                    MessageBox.information("Deleted record(s) cannot be edited.");
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

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matType").getData());

                //aData = this.getView().getModel("matType").getData().results.filter(item => item.Deleted === false);
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

                var oIconTabBar = this.byId("itbMatClass");
                oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey());

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matClass").getData());

                var aData = this.getView().getModel("matClass").getData().results.filter(item => item.Deleted === false);
                this.getView().getModel("matClass").setProperty("/results", aData);

                this.setRowEditMode("matClass");
            },

            onEditMatAttrib() {
                var oModel = this.getOwnerComponent().getModel();

                oModel.read("/GMCAttribSet", {
                    success: function(data, oResponse) {
                        var aData = _this.getView().getModel("matAttrib").getData().results.filter(item => item.Deleted === false);
                        console.log("onEditMatAttrib", aData.filter(x => x.Mattypcls == "ZFABC" && x.Attribcd == "0000004"));
                        aData = aData.filter(x => data.results.filter(y => y.Mattypcls == x.Mattypcls && y.Attribcd == x.Attribcd).length == 0);
                        console.log("onEditMatAttrib2", aData.filter(x => x.Mattypcls == "ZFABC" && x.Attribcd == "0000004"));

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

                        var oIconTabBar = _this.byId("itbMatClass");
                        oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey());
                        _this._oDataBeforeChange = jQuery.extend(true, {}, _this.getView().getModel("matAttrib").getData());
                        _this.getView().getModel("matAttrib").setProperty("/results", aData);
                        _this.setRowEditMode("matAttrib");
                    },
                    error: function(err) {
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

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey());

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("batchControl").getData());

                var aData = this.getView().getModel("batchControl").getData().results.filter(item => item.Deleted === false);
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
                                if (ci.type === "Edm.Boolean") {
                                    // col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", editable: true}));
                                    col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", 
                                        select: this.onCheckBoxChange.bind(this),    
                                        editable: true
                                    }));
                                }
                                else if (ci.valueHelp["show"]) {
                                    if (ci.valueHelp["items"].path.includes("results")) {
                                        col.setTemplate(new sap.m.Input({
                                            // id: "ipt" + ci.name,
                                            type: "Text",
                                            value: "{" + arg + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            showValueHelp: true,
                                            valueHelpRequest: this.handleValueHelp.bind(this),
                                            showSuggestion: true,
                                            suggestionItems: {
                                                path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                                length: 1000,
                                                template: new sap.ui.core.Item({
                                                    key: "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].value + "}",
                                                    text: (!ci.valueHelp.suggestionItems.showSecondaryValue ?
                                                        "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].value + "}" :
                                                        "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].value + "}"  + "  -  (" + 
                                                        "{" + ci.valueHelp["items"].path.replace("/results", "") + ci.valueHelp["items"].text + "})")
                                                }),
                                                templateShareable: false
                                            },
                                            maxSuggestionWidth: "340px",
                                            change: this.onInputChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            // id: "ipt" + ci.name,
                                            type: "Text",
                                            value: "{" + arg + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            showValueHelp: true,
                                            valueHelpRequest: this.handleValueHelp.bind(this),
                                            showSuggestion: true,
                                            suggestionItems: {
                                                path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                                length: 1000,
                                                template: new sap.ui.core.Item({
                                                    key: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}",
                                                    text: (!ci.valueHelp.suggestionItems.showSecondaryValue ?
                                                        "{" + ci.valueHelp["items"].value + "}" :
                                                        "{" + ci.valueHelp["items"].value + "}" + "  -  (" + "{" + ci.valueHelp["items"].text + "})"
                                                        )//"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}", //ci.valueHelp["suggestionItems"].text
                                                }),
                                                templateShareable: false
                                            },
                                            maxSuggestionWidth: "270px",
                                            change: this.onInputChange.bind(this)
                                        }));
                                    }
                                }
                                else if (ci.type === "Edm.Decimal" || ci.type === "Edm.Double" || ci.type === "Edm.Float" || ci.type === "Edm.Int16" || ci.type === "Edm.Int32" || ci.type === "Edm.Int64" || ci.type === "Edm.SByte" || ci.type === "Edm.Single") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        value: "{" + arg + ">" + ci.name + "}",
                                        liveChange: this.onNumberLiveChange
                                        // change: this.onInputChange.bind(this)
                                    }));
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            change: this.onInputTextChange.bind(this)
                                            //liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            change: this.onInputTextChange.bind(this)
                                            //liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }
                            }

                            if (ci.required) {
                                col.getLabel().setText(col.getLabel().getText() + "*");
                                col.getLabel().addStyleClass("requiredField");
                            }
                        })
                })
            },

            onNumberLiveChange: function(oEvent) {
                console.log(oEvent.getParameters())
                console.log(oEvent.getParameters().value.split("."))

                if (oEvent.getParameters().value.split(".")[1].length > 2) {
                    console.log("not allowed")
                }
            },

            onCancelMatType() {
                MessageBox.confirm("Disregard changes?", {
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
                            _this.onTableResize("MatType","Min");
                            _this.setRowReadMode("matType");
                            _this.getView().getModel("matType").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                            
                        }
                    }
                });
            },

            onCancelMatClass() {
                MessageBox.confirm("Disregard changes?", {
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
                            _this.onTableResize("MatClass","Min");
                            _this.setRowReadMode("matClass");
                            _this.getView().getModel("matClass").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                        }
                    }
                });
            },

            onCancelMatAttrib() {
                MessageBox.confirm("Disregard changes?", {
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
                            _this.onTableResize("MatAttrib","Min");
                            _this.setRowReadMode("matAttrib");
                            _this.getView().getModel("matAttrib").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                        }
                    }
                });
            },

            onCancelBatchControl() {
                MessageBox.confirm("Disregard changes?", {
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
                            _this.onTableResize("BatchControl","Min");
                            _this.setRowReadMode("batchControl");
                            _this.getView().getModel("batchControl").setProperty("/", _this._oDataBeforeChange);
                            _this._aInvalidValueState = [];
                        }
                    }
                });
            },

            onAddRow(pModel) {
                this.onCreate(pModel + "Tab", pModel);
            },

            onRemoveRow(pModel) {
                var oTable = this.byId(pModel + "Tab");
                var aNewRows = this.getView().getModel(pModel).getData().results.filter(item => item.New === true);
                aNewRows.splice(oTable.getSelectedIndices(), 1);
                console.log("onremoverow", aNewRows);
                this.getView().getModel(pModel).setProperty("/results", aNewRows);
            },

            onSave(arg) {
          
                if (this._aInvalidValueState.length > 0) {
                    var bCompact = true;

                    MessageBox.error("Invalid data. Saving failed.",
                        {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );

                    return;
                }

                var aNewRows = this.getView().getModel(arg).getData().results.filter(item => item.New === true);
                var aEditedRows = this.getView().getModel(arg).getData().results.filter(item => item.Edited === true);
                
                var aNewEditRows = aNewRows.length > 0 ? aNewRows : aEditedRows;
                console.log("aNewEditRows", aNewEditRows);
                
                // Validate Use GMC and GMC No. Range
                if (arg == "matType") {
                    var gmcValidate = aNewEditRows.filter(x => x.Hasgmc && !x.Gmcnrkeycd);
                    if (gmcValidate.length > 0) {
                        var bCompact = true;
                        MessageBox.error("\"GMC No. Range\" is required if \"Use GMC\" is selected.",
                            {
                                styleClass: bCompact ? "sapUiSizeCompact" : ""
                            }
                        );
                        return;
                    }
                } else if (arg == "matAttrib") {
                    if (this._oDataBeforeChange.results.length > 0) {
                        
                        var descValidate = aNewEditRows.filter(
                            x => this._oDataBeforeChange.results.filter(
                                y => (y.Shorttext.toUpperCase() == x.Shorttext.toUpperCase() || 
                                    y.Shorttext2.toUpperCase() == x.Shorttext2.toUpperCase())).length > 0);

                        if (descValidate.length > 0) {
                            MessageBox.error("\"Desc (EN)\" / \"Desc (CN)\" is already been used.");
                            return;
                        }
                    }
                    
                }

                // Validate required field if has value.
                var isValid = true;
                var sInvalidMsg = "";
                var aRequiredFields = this._aColumns[arg].filter(x => x.required).map(x => x.name);
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

                                if (col.type == "Edm.Boolean") {
                                    if (item[col.name]) cellValue = "X";
                                    else cellValue = "";
                                } else cellValue = item[col.name];

                                param[col.name] = cellValue;
                            }
                        })

                        if (arg != "matType") {
                            param["Mattyp"] = this.getView().getModel("ui").getData().activeMatType;
                        }

                        if (arg === "matAttrib") {
                            param["Mattypcls"] = this.getView().getModel("ui").getData().activeMatClass;
                            param["Attribcd"] = item["Attribcd"];
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
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    var oError = JSON.parse(err.responseText);
                                    var sError = oError.error.message.value;

                                    MessageBox.error(sError,
                                    {
                                        styleClass: bCompact ? "sapUiSizeCompact" : ""
                                    });
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

                                    if (col.type == "Edm.Boolean") {
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

                                    // if (arg == "matType") {
                                    //     _this.onSaveMatTypeDesc(item.Mattyp, item.Desc);
                                    // }

                                    if (iEdited === aEditedRows.length) {
                                        _this.setButton(arg, "Save");
                                    }

                                    _this._aInvalidValueState = [];
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    var oError = JSON.parse(err.responseText);
                                    var sError = oError.error.message.value;

                                    MessageBox.error(sError,
                                    {
                                        styleClass: bCompact ? "sapUiSizeCompact" : ""
                                    });
                                }
                            });
                        }, 500)
                    });
                }
                else {
                    var bCompact = true;

                    MessageBox.information("No data have been modified.",
                        {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );
                }
            },

            onSaveMatTypeDesc(arg1, arg2) {
                var entitySet = "/MatTypeDescRscSet(Spras='E',Mtart='" + arg1 + "')";
                var sDesc = (arg2 == null ? "" : arg2);
                var param = {Mtbez: sDesc};

                var oModel = this.getOwnerComponent().getModel();
                oModel.update(entitySet, param, {
                    method: "PUT",
                    success: function(data, oResponse) {
                    },
                    error: function(err) {
                    }
                });
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
                    MessageBox.information("No record(s) have been selected for deletion.");
                }
                else {
                    MessageBox.confirm("Proceed to delete " + aSelRows.length + " record(s)?", {
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
                                        "Deleted": "X"
                                    };
                                    console.log("delete", sParam, oParam)
                                    setTimeout(() => {
                                        oModel.update(oEntitySet, oParam, {
                                            method: "PUT",
                                            success: function(data, oResponse) {
                                                oModelContext.setProperty(sPath + '/Deleted', true);
                                            },
                                            error: function() {
                                                // alert("Error");
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
                //             item.Hasgmc = item.Hasgmc === "X" ? true : false;
                //             item.Isbatch = item.Isbatch === "X" ? true : false;
                //             item.Prodout = item.Prodout === "X" ? true : false;
                //             item.Excind = item.Excind === "X" ? true : false;
                //             item.Deleted = item.Deleted === "X" ? true : false;

                //             if (item.Createddt !== null)
                //                 item.Createddt = dateFormat.format(item.Createddt);

                //             if (item.Updateddt !== null)
                //                 item.Updateddt = dateFormat.format(item.Updateddt);
                                
                //             if (index === 0) {
                //                 item.Active = true;
                //             }
                //             else {
                //                 item.Active = false;
                //             }
                //         })

                //         oJSONModel.setData(data);
                        
                //         //var aFilters = _this.getView().byId("matTypeTab").getBinding("rows").aFilters;
                //         //console.log("aFilters",  aFilters, _this.getView().byId("matTypeTab").getBinding("rows"))
                //         _this.getView().setModel(oJSONModel, "matType");
                //         //console.log("aFilters2",  aFilters, _this.getView().byId("matTypeTab").getBinding("rows"))
                //         // _this.onRefreshFilter("matTypeTab", aFilters);
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

            onRefreshFilter(pModel, pFilters) {
                if (pFilters.length > 0) {
                    pFilters.forEach(item => {
                        var iColIdx = _this._aColumns[pModel].findIndex(x => x.name == item.sPath);
                        _this.getView().byId(pModel + "Tab").filter(_this.getView().byId(pModel + "Tab").getColumns()[iColIdx], 
                            item.oValue1);
                    });
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
                
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.ColumnDialog"];
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
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.ColumnDialog"];
                var oDialogTable = oDialog.getContent()[0];
                var aSelRows = oDialogTable.getSelectedIndices();

                if (aSelRows.length === 0) {
                    MessageBox.information("Please select at least one visible column.");
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
                this._oViewSettingsDialog["zuimattype3.view.ColumnDialog"].close();
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

                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];
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
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];
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
                this._oViewSettingsDialog["zuimattype3.view.SortDialog"].close();
            },

            onColFilter: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent               
                var aFilterableColumns = this._aFilterableColumns[oTable.getBindingInfo("rows").model];

                var oDialog = this._oViewSettingsDialog["zuimattype3.view.FilterDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aFilterableColumns);
                oDialog.getModel().setProperty("/rowCount", aFilterableColumns.length);
                oDialog.open();
            },

            onColFilterConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.FilterDialog"];
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
                this._oViewSettingsDialog["zuimattype3.view.FilterDialog"].close();
            },

            onFilter(oEvent) {
                var oColumn = oEvent.getParameter("column");
                var sId = oColumn.sId;
                var sTable = sId.substring(0, sId.indexOf("Col", 0));
                var sColumn = sId.substring(sId.indexOf("Col", 0) + 3);

                var colProps = (this._aColumns[sTable].filter(x => x.name == sColumn))[0];
                if (colProps.type == "Edm.Boolean") {
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
                var vMatType = oEvent.getParameters().rowBindingContext.getObject().Mattyp;
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
                    }

                    if (oColumns[i].getSorted()) {
                        oColumns[i].setSorted(false);
                    }
                }
            },

            onCellClickMatClass: function(oEvent) {
                var vMatClass = oEvent.getParameters().rowBindingContext.getObject().Mattypcls;
                var vMatClassSeq = oEvent.getParameters().rowBindingContext.getObject().Seq;

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
                        if (sDataType === "Edm.Boolean") aFilter.push(new Filter(item.name, FilterOperator.EQ, sQuery));
                        else aFilter.push(new Filter(item.name, FilterOperator.Contains, sQuery));
                    })

                    oFilter = new Filter(aFilter, false);

                    // oFilter = new Filter([
                    //     new Filter("MatTyp", FilterOperator.Contains, sQuery),
                    //     new Filter("Mattyp", FilterOperator.Contains, sQuery)
                    // ], false);
                }
    
                this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
                console.log("filterGlobally", this.byId(sTable + "Tab").getBinding("rows"))
            },

            createViewSettingsDialog: function (arg1, arg2) {
                var sDialogFragmentName = null;

                if (arg1 === "sort") sDialogFragmentName = "zuimattype3.view.SortDialog";
                else if (arg1 === "filter") sDialogFragmentName = "zuimattype3.view.FilterDialog";
                else if (arg1 === "column") sDialogFragmentName = "zuimattype3.view.ColumnDialog";

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

                if (sEntity == "/results") {

                    var vCellPath = _this._inputField;
                    var vColProp = _this._aColumns[sModel].filter(item => item.name === vCellPath);
                    var vItemValue = vColProp[0].valueHelp.items.value;
                    var vItemDesc = vColProp[0].valueHelp.items.text;

                    var listModel = oSource.getBindingInfo("suggestionItems").model;
                    this.getView().getModel(listModel).getData().results.forEach(item => {
                        item.VHTitle = item[vItemValue];
                        item.VHDesc = item[vItemDesc];
                        item.VHSelected = (item[vItemValue] === _this._inputValue);
                    });

                    if (!_this._valueHelpDialog) {
                    
                        _this._valueHelpDialog = sap.ui.xmlfragment(
                            "zuimattype3.view.ValueHelpDialog",
                            _this
                        );
    
                        _this._valueHelpDialog.setModel(
                            new JSONModel({
                                items: this.getView().getModel(listModel).getData().results,
                                title: vColProp[0].label,
                                table: sModel
                            })
                        )
    
                        _this.getView().addDependent(_this._valueHelpDialog);
                    } else {
                        _this._valueHelpDialog.setModel(
                            new JSONModel({
                                items: this.getView().getModel(listModel).getData().results,
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

                    var sPath = oSource.getParent().oBindingContexts[sModel].sPath;
                    var rowModel = _this.getView().getModel("matType").getProperty(sPath);
                    var sFilter = "";
                    if (vColProp[0].valueHelp.items.filter) {
                        sFilter = vColProp[0].valueHelp.items.filter;
                        var regex = new RegExp('@', 'g');
                        var iCount = (sFilter.match(regex) == null ? 0 : sFilter.match(regex).length);
                        
                        for (var i = 0; i < iCount; i++) {
                            for (var j = 0; j < iCount; j++) {
                                var colFilter = _this._aColumns[sModel][j].name;
                                if (sFilter.includes("@" + colFilter)) {
                                    sFilter = sFilter.replace("@" + colFilter, "'" + rowModel[colFilter] + "'");
                                    break;
                                }
                            }
                        }
                    }

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
                                    "zuimattype3.view.ValueHelpDialog",
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
                        error: function (err) { }
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
                    //var sTable = this._oViewSettingsDialog["zuimattype3.view.ValueHelpDialog"].getModel().getData().table;
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
                            this.getView().getModel(sTable).setProperty(sRowPath + '/Edited', true);
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
                    //     data.filter(item => item[this.inputField] === oSelectedItem.getTitle()).forEach(e => e.Edited = true);
                    // }
                }
            },

            onInputChange: function(oEvent) {
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
                //console.log("oninputchange2", sRowPath, sModel, oSource.getBindingInfo("value"))
                this.getView().getModel(sModel).setProperty(sRowPath + '/' + sColumn, oSource.mProperties.selectedKey);
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
                //console.log(oSource, oSource.getValueState(), oSource.getParent())
            },

            onInputTextChange: function(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
                console.log("onInputChange2", sRowPath, oSource.getBindingInfo("value"), sModel, this.getView().getModel(sModel).getData())
                //console.log(oSource, oSource.getValueState(), oSource.getParent())
            },

            onCheckBoxChange: function(oEvent) {
                const oSource = oEvent.getSource();

                var sRowPath = oSource.getBindingInfo("selected").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("selected").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
                
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
                var oTable = this.byId(arg + "Tab");

                oTable.getColumns().forEach((col, idx) => {     
                    if (col.getLabel().getText().includes("*")) {
                        col.getLabel().setText(col.getLabel().getText().replaceAll("*", ""));
                    }   

                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (ci.type === "Edm.String" || ci.type === "Edm.Decimal") {
                                col.setTemplate(new sap.m.Text({text: "{" + arg + ">" + ci.name + "}"}));
                            }
                            else if (ci.type === "Edm.Boolean") {
                                col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", editable: false}));
                            }

                            if (ci.required) {
                                col.getLabel().removeStyleClass("requiredField");
                            }
                        })
                })
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
                    if (item.Deleted) {
                        aData.splice(idx, 0, item)
                    }
                })

                //var aData = this._onData
                this.getView().getModel(arg).setProperty("/results", aData);
            },

            onColSortCellClick: function (oEvent) {
                this._oViewSettingsDialog["zuimattype3.view.SortDialog"].getModel().setProperty("/activeRow", (oEvent.getParameters().rowIndex));
            },

            onColSortSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];               
                oDialog.getContent()[0].addSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onColSortDeSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];               
                oDialog.getContent()[0].removeSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onColSortRowFirst: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = this._oViewSettingsDialog["zuimattype3.view.SortDialog"].getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow)
                    .forEach(item => item.position = 0);
                oDialogData.filter((item, index) => index !== iActiveRow)
                    .forEach((item, index) => item.position = index + 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },

            onColSortRowUp: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow).forEach(item => item.position = iActiveRow - 1);
                oDialogData.filter((item, index) => index === iActiveRow - 1).forEach(item => item.position = item.position + 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },

            onColSortRowDown: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow).forEach(item => item.position = iActiveRow + 1);
                oDialogData.filter((item, index) => index === iActiveRow + 1).forEach(item => item.position = item.position - 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow + 1);
            },

            onColSortRowLast: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.SortDialog"];
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
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.ColumnDialog"];               
                oDialog.getContent()[0].addSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onColPropDeSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimattype3.view.ColumnDialog"];               
                oDialog.getContent()[0].removeSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },

            onRowSelectionChangeMatType: function(oEvent) {
                console.log("onRowSelectionChange", oEvent)
                // var indices = e.getParameter('rowIndices'); 
                // for (var i = 0; i < indices.length; i++) {
                //     var idx = indices[i];
                // }
            }

        });
    });
