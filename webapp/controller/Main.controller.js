sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Token",
    'sap/m/SearchField',
    'sap/ui/model/type/String',
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, MessageBox, Token, SearchField, typeString) {
        "use strict";

        var _this;
        var _oCaption = {};
        var _aSmartFilter;
        var _sSmartFilterGlobal;
        var _aTableProp = [];

        return BaseController.extend("zuimattype3.controller.Main", {
            
            onInit: function () {
                _this = this;
                _this._sActiveTable = "matTypeTab";
                _this._sDataMode = "READ";   
                
                _this.getCaption();

                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MATTYPE_FILTER_CDS");
                var oSmartFilter = this.getView().byId("sfbMatType");
                oSmartFilter.setModel(oModel);

                // this._oMultiInput = this.getView().byId("multiInputMatTyp");
                // this._oMultiInput.addValidator(this._onMultiInputValidate.bind(this));

                _this.initializeComponent();
            },

            initializeComponent() {
                _this.getView().setModel(new JSONModel({
                    sbu: "VER", // temporary Sbu
                    rowCountMatType: "0",
                    rowCountMatClass: "0",
                    rowCountMatAttrib: "0",
                    rowCountBatchControl: "0"
                }), "ui");

                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                this.getAppAction();

                setTimeout(() => {
                    var bAppChange = _this.getView().getModel("base").getProperty("/appChange");
                    _this.setControlAppAction(bAppChange);
                }, 100);

                _this.showLoadingDialog("Loading...");

                _aTableProp.push({
                    modCode: "MATTYPEMOD",
                    tblSrc: "ZDV_MATTYPE",
                    tblId: "matTypeTab",
                    tblModel: "matType"
                });

                _aTableProp.push({
                    modCode: "MATCLASSMOD",
                    tblSrc: "ZERP_MATTYPCLS",
                    tblId: "matClassTab",
                    tblModel: "matClass"
                });

                _aTableProp.push({
                    modCode: "MATATTRIBMOD",
                    tblSrc: "ZERP_MATTYPATRB",
                    tblId: "matAttribTab",
                    tblModel: "matAttrib"
                });

                _aTableProp.push({
                    modCode: "BATCHCTRLMOD",
                    tblSrc: "ZERP_MTBC",
                    tblId: "batchControlTab",
                    tblModel: "batchControl"
                });

                _this.getColumns(_aTableProp);

                var aSmartFilter = this.getView().byId("sfbMatType").getFilters();
                if (aSmartFilter.length == 0) {
                    this.enableDisableButton("matType", "disable");
                    this.enableDisableButton("matClass", "disable");
                    this.enableDisableButton("matAttrib", "disable");
                    this.enableDisableButton("batchControl", "disable");
                }

                _this._tableRendered = "";
                var oTableEventDelegate = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    },

                    onAfterRendering: function(oEvent) {
                        _this.onAfterTableRendering(oEvent);
                    },

                    onclick: function(oEvent) {
                        _this.onTableClick(oEvent);
                    }
                };

                this.byId("matTypeTab").addEventDelegate(oTableEventDelegate);
                this.byId("matClassTab").addEventDelegate(oTableEventDelegate);
                this.byId("matAttribTab").addEventDelegate(oTableEventDelegate);
                this.byId("batchControlTab").addEventDelegate(oTableEventDelegate);

                this._aEntitySet = {
                    matType: "MaterialTypeSet", 
                    matClass: "MaterialClsSet", 
                    matAttrib: "MaterialAttribSet", 
                    batchControl: "BatchControlSet"
                };

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                //console.log("onAfterTableRendering", pTableId)
            },

            async onSearch(oEvent) {
                this.showLoadingDialog("Loading...");

                var aSmartFilter = this.getView().byId("sfbMatType").getFilters();
                var sSmartFilterGlobal = "";
                // if (oEvent) sSmartFilterGlobal = oEvent.getSource()._oBasicSearchField.mProperties.value;
                
                _aSmartFilter = aSmartFilter;
                _sSmartFilterGlobal = sSmartFilterGlobal;

                this.getMatType(aSmartFilter, sSmartFilterGlobal);

                this.enableDisableButton("matType", "enable");
                this.enableDisableButton("matClass", "enable");
                this.enableDisableButton("matAttrib", "enable");
                this.enableDisableButton("batchControl", "enable");

                await this.getResources();
            },

            getMatType(pFilters, pFilterGlobal) {
                _this.showLoadingDialog("Loading...");

                var oModel = this.getOwnerComponent().getModel();       
                var oTable = _this.getView().byId("matTypeTab");

                oModel.read('/MaterialTypeViewSet', {
                    success: function (data, response) {
                        //console.log("MaterialTypeViewSet", data)
                        if (data.results.length > 0) {
                            
                            data.results.forEach((item, index) => {
                                item.HASGMC = item.HASGMC === "X" ? true : false;
                                item.ISBATCH = item.ISBATCH === "X" ? true : false;
                                item.PRODOUT = item.PRODOUT === "X" ? true : false;
                                item.EXCIND = item.EXCIND === "X" ? true : false;
                                item.DELETED = item.DELETED === "X" ? true : false;

                                if (item.CREATEDDT !== null)
                                    item.CREATEDDT = _this.formatDatePH(item.CREATEDDT);

                                if (item.UPDATEDDT !== null)
                                    item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT);

                                if (index === 0) {
                                    item.ACTIVE = "X";
                                }
                                else {
                                    item.ACTIVE = "";
                                }
                            });

                            var aFilterTab = [];
                            if (oTable.getBinding("rows")) {
                                aFilterTab = oTable.getBinding("rows").aFilters;
                            }

                            var oJSONModel = new JSONModel();
                            oJSONModel.setData(data);
                            _this.getView().setModel(oJSONModel, "matType");
                            _this._tableRendered = "matTypeTab";

                            _this.onFilterBySmart("matType", pFilters, pFilterGlobal, aFilterTab);

                            _this.setRowReadMode("matType");

                            _this.getView().getModel("ui").setProperty("/activeMatType", data.results[0].MATTYP);
                            _this.getView().getModel("ui").setProperty("/rowCountMatType", oTable.getBinding("rows").aIndices.length.toString());

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
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT);

                            if (index === 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("matClassTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("matClassTab").getBinding("rows").aFilters;
                        }
                        
                        _this.getView().setModel(oJSONModel, "matClass");
                        _this.getView().getModel("ui").setProperty("/rowCountMatClass", data.results.length.toString());


                        if (data.results.length > 0) {
                            _this._tableRendered = "matClassTab";
                            
                            _this.getView().getModel("ui").setProperty("/activeMatClass", data.results[0].MATTYPCLS);
                            _this.getView().getModel("ui").setProperty("/activeMatClassSeq", data.results[0].SEQ);
                            //_this.getMatAttrib();

                            _this.setActiveRowHighlight("matClass");                            
                        }

                        _this.setRowReadMode("matClass");
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
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT);

                            if (index === 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("matAttribTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("matAttribTab").getBinding("rows").aFilters;
                        }

                        _this.getView().setModel(oJSONModel, "matAttrib");
                        _this.getView().getModel("ui").setProperty("/rowCountMatAttrib", data.results.length.toString());

                        _this._tableRendered = "matAttribTab";
                        _this.setActiveRowHighlight("matAttrib");

                        _this.setRowReadMode("matAttrib");
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
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT);

                            if (index === 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        oJSONModel.setData(data);

                        var aFilters = [];
                        if (_this.getView().byId("batchControlTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("batchControlTab").getBinding("rows").aFilters;
                        }

                        _this.getView().setModel(oJSONModel, "batchControl");
                        _this.getView().getModel("ui").setProperty("/rowCountBatchControl", data.results.length.toString());

                        _this._tableRendered = "batchControlTab";
                        _this.setActiveRowHighlight("batchControl");

                        _this.setRowReadMode("batchControl");
                    },
                    error: function (err) { 
                        _this.closeLoadingDialog();
                    }
                })
            },

            getLookUpFilter(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var sEntitySet = arg.valueHelp.entitySet;
                var sNewModel = arg.valueHelp.items.path.substring(0, arg.valueHelp.items.path.indexOf(">"));
                var sFilter = arg.valueHelp.filter;

                if (arg.name == "MATTYP") {
                    var p1 = this.getView().getModel("ui").getProperty("/sbu");
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
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    var sModel = "";
                    if (oTable.getId().indexOf("matTypeTab") >= 0) sModel = "matType";
                    else if (oTable.getId().indexOf("matClassTab") >= 0) sModel = "matClass";
                    else if (oTable.getId().indexOf("matAttribTab") >= 0) sModel = "matAttrib";
                    else if (oTable.getId().indexOf("batchControlTab") >= 0) sModel = "batchControl";

                    if (sModel == "matType") {
                        //this.byId("matTypeTab").setSelectedIndex(0);
                        var sRowId = this.byId(oEvent.srcControl.sId);
                        var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["matType"].sPath;
                        var oRow = this.getView().getModel("matType").getProperty(sRowPath);
                        var sMattyp = oRow.MATTYP;
                        this.getView().getModel("ui").setProperty("/activeMatType", sMattyp);

                        this.getMatClass();
                        this.getBatchControl();
                    }

                    if (this.byId(oEvent.srcControl.sId).getBindingContext(sModel)) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext(sModel).sPath;

                        oTable.getModel(sModel).getData().results.forEach(row => row.ACTIVE = "");
                        oTable.getModel(sModel).setProperty(sRowPath + "/ACTIVE", "X");

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext(sModel) && row.getBindingContext(sModel).sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
                    }
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
                this.byId("btnFullScreenMatType").setVisible(false);
                this.onTableResize("MatType","Max");
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.byId("btnTabLayoutMatType").setVisible(false);

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matType").getData());
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
                this.byId("btnFullScreenMatClass").setVisible(false);
                this.onTableResize("MatClass","Max");
                this.byId("btnExitFullScreenMatClass").setVisible(false);
                this.byId("btnTabLayoutMatClass").setVisible(false);

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matClass").getData());
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
                    this.byId("btnFullScreenMatAttrib").setVisible(false);
                    this.onTableResize("MatAttrib","Max");
                    this.byId("btnExitFullScreenMatAttrib").setVisible(false);
                    this.byId("btnTabLayoutMatAttrib").setVisible(false);
                    // console.log(this.getView().getModel("matAttrib").getData())
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matAttrib").getData());
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
                this.byId("btnFullScreenBatchControl").setVisible(false);
                this.onTableResize("BatchControl","Max");
                this.byId("btnExitFullScreenBatchControl").setVisible(false);
                this.byId("btnTabLayoutBatchControl").setVisible(false);

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("batchControl").getData());
                this.setRowCreateMode("batchControl");
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
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.onTableResize("MatType","Max");
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.byId("btnTabLayoutMatType").setVisible(false);

                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matType").getData());
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
                this.byId("btnExitFullScreenMatClass").setVisible(false);
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
                        _this.byId("btnExitFullScreenMatAttrib").setVisible(false);
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
                this.byId("btnExitFullScreenBatchControl").setVisible(false);
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
                var aNewRows = this.getView().getModel("matType").getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel("matType").getData().results.filter(item => item.EDITED === true);

                if (aNewRows.length > 0 || aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONF_DISCARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {
                                _this.cancelMatType();
                            }
                        }
                    });
                } else {
                    _this.cancelMatType();
                }
            },

            cancelMatType() {
                _this.byId("btnAddMatType").setVisible(true);
                _this.byId("btnEditMatType").setVisible(true);
                _this.byId("btnAddRowMatType").setVisible(false);
                _this.byId("btnRemoveRowMatType").setVisible(false);
                _this.byId("btnSaveMatType").setVisible(false);
                _this.byId("btnCancelMatType").setVisible(false);
                _this.byId("btnDeleteMatType").setVisible(true);
                _this.byId("btnRefreshMatType").setVisible(true);
                _this.byId("btnFullScreenMatType").setVisible(true);
                _this.byId("btnTabLayoutMatType").setVisible(true);

                _this.onTableResize("MatType","Min");

                // _this.setRowReadMode("matType");
                // _this.getView().getModel("matType").setProperty("/", _this._oDataBeforeChange);
                _this.onRefreshMatType();
                _this._aInvalidValueState = [];
            },

            onCancelMatClass() {
                var aNewRows = this.getView().getModel("matClass").getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel("matClass").getData().results.filter(item => item.EDITED === true);

                if (aNewRows.length > 0 || aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONF_DISCARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {
                                _this.cancelMatClass();
                            }
                        }
                    });
                } else {
                    _this.cancelMatClass();
                }
            },

            cancelMatClass() {
                _this.byId("btnAddMatClass").setVisible(true);
                _this.byId("btnEditMatClass").setVisible(true);
                _this.byId("btnAddRowMatClass").setVisible(false);
                _this.byId("btnRemoveRowMatClass").setVisible(false);
                _this.byId("btnSaveMatClass").setVisible(false);
                _this.byId("btnCancelMatClass").setVisible(false);
                _this.byId("btnDeleteMatClass").setVisible(true);
                _this.byId("btnRefreshMatClass").setVisible(true);
                _this.byId("btnFullScreenMatClass").setVisible(true);
                _this.byId("btnTabLayoutMatClass").setVisible(true);

                _this.onTableResize("MatClass","Min");

                // _this.setRowReadMode("matClass");
                // _this.getView().getModel("matClass").setProperty("/", _this._oDataBeforeChange);
                _this.onRefreshMatClass();
                _this._aInvalidValueState = [];
            },

            onCancelMatAttrib() {
                var aNewRows = this.getView().getModel("matAttrib").getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel("matAttrib").getData().results.filter(item => item.EDITED === true);

                if (aNewRows.length > 0 || aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONF_DISCARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {
                                _this.cancelMatAttrib();
                            }
                        }
                    });
                } else {
                    _this.cancelMatAttrib();
                }
            },

            cancelMatAttrib() {
                _this.byId("btnAddMatAttrib").setVisible(true);
                _this.byId("btnEditMatAttrib").setVisible(true);
                _this.byId("btnAddRowMatAttrib").setVisible(false);
                _this.byId("btnRemoveRowMatAttrib").setVisible(false);
                _this.byId("btnSaveMatAttrib").setVisible(false);
                _this.byId("btnCancelMatAttrib").setVisible(false);
                _this.byId("btnDeleteMatAttrib").setVisible(true);
                _this.byId("btnRefreshMatAttrib").setVisible(true);
                _this.byId("btnFullScreenMatAttrib").setVisible(true);
                _this.byId("btnTabLayoutMatAttrib").setVisible(true);
                _this.onTableResize("MatAttrib","Min");
                _this.setRowReadMode("matAttrib");
                _this.getView().getModel("matAttrib").setProperty("/", _this._oDataBeforeChange);
                _this._aInvalidValueState = [];
            },

            onCancelBatchControl() {
                var aNewRows = this.getView().getModel("batchControl").getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel("batchControl").getData().results.filter(item => item.EDITED === true);

                if (aNewRows.length > 0 || aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONF_DISCARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {
                                _this.cancelBatchControl();
                            }
                        }
                    });
                } else {
                    _this.cancelBatchControl();
                }
            },

            cancelBatchControl() {
                _this.byId("btnAddBatchControl").setVisible(true);
                _this.byId("btnEditBatchControl").setVisible(true);
                _this.byId("btnAddRowBatchControl").setVisible(false);
                _this.byId("btnRemoveRowBatchControl").setVisible(false);
                _this.byId("btnSaveBatchControl").setVisible(false);
                _this.byId("btnCancelBatchControl").setVisible(false);
                _this.byId("btnDeleteBatchControl").setVisible(true);
                _this.byId("btnRefreshBatchControl").setVisible(true);
                _this.byId("btnFullScreenBatchControl").setVisible(true);
                _this.byId("btnTabLayoutBatchControl").setVisible(true);
                _this.onTableResize("BatchControl","Min");
                _this.setRowReadMode("batchControl");
                _this.getView().getModel("batchControl").setProperty("/", _this._oDataBeforeChange);
                _this._aInvalidValueState = [];
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
                var aRequiredFields = this._aColumns[arg].filter(x => x.Mandatory).map(x => x.ColumnName);
                
                for (var i = 0; i < aRequiredFields.length; i++) {
                    var sRequiredField = aRequiredFields[i];
                    if (aNewEditRows.filter(x => !x[sRequiredField]).length > 0) {
                        isValid = false;
                        sInvalidMsg = "\"" + this._aColumns[arg].filter(x => x.ColumnName == sRequiredField)[0].ColumnLabel + "\" is required."
                        break;
                    }
                }

                if (!isValid) {
                    var bCompact = true;
                    MessageBox.error(sInvalidMsg);

                    _this.closeLoadingDialog();
                    return;
                }
                console.log("onsave", _this._aColumns, aNewRows, aEditedRows, this._aEntitySet)
                if (aNewRows.length > 0) {
                    var oModel = this.getOwnerComponent().getModel();
                    var iNew = 0;

                    aNewRows.forEach((item, idx) => {

                        var entitySet = "/" + this._aEntitySet[arg];
                        var param = {};

                        _this._aColumns[arg].forEach(col => {
                            if (col.Creatable) {
                                var cellValue;

                                if (col.DataType == "BOOLEAN") {
                                    if (item[col.ColumnName]) cellValue = "X";
                                    else cellValue = "";
                                } else cellValue = item[col.ColumnName];

                                param[col.ColumnName] = cellValue;
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

                                    sError = sError.replace("Property", "Column");
                                    sError = sError.replace("at offset '20'", "");

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

                        var iKeyCount = this._aColumns[arg].filter(col => col.Key == true || col.Key == "X").length;

                        _this._aColumns[arg].forEach(col => {
                            if (col.Editable) {
                                if (!(arg == "matType" && col.ColumnName == "Desc")) {
                                    var cellValue;

                                    if (col.DataType == "BOOLEAN") {
                                        if (item[col.ColumnName]) cellValue = "X";
                                        else cellValue = "";
                                    } else cellValue = item[col.ColumnName];
    
                                    param[col.ColumnName] = cellValue;
                                }
                            } 

                            if (iKeyCount === 1) { 
                                if (col.Key == true || col.Key == "X") entitySet += "'" + item[col.ColumnName] + "'" 
                            }
                            else if (iKeyCount > 1) { 
                                if (col.Key == true || col.Key == "X") entitySet += col.ColumnName + "='" + item[col.ColumnName] + "',"
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

                                    sError = sError.replace("Property", "Column");
                                    sError = sError.replace("at offset '20'", "");
                                    
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
                    this.byId("btnFullScreen" + pTable).setVisible(false);
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
                    this.byId("btnFullScreen" + pTable).setVisible(true);
                    this.onTableResize(pTable, "Min");
                    this.byId("btnExitFullScreen" + pTable).setVisible(false);
                    this.byId("btnTabLayout" + pTable).setVisible(false);
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
                    this.byId("btnFullScreen" + pTable).setEnabled(true);
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
                    this.byId("btnFullScreen" + pTable).setEnabled(false);
                    this.byId("btnExitFullScreen" + pTable).setEnabled(false);
                    this.byId("btnTabLayout" + pTable).setEnabled(false);
                }
            },

            onDeleteMatType() {
                this.delete("matType", "MaterialTypeSet");            
            },

            onDeleteMatClass() {
                this.delete("matClass", "MaterialClsSet");
            },

            onDeleteMatAttrib() {
                this.delete("matAttrib", "MaterialAttribSet");
            },

            onDeleteBatchControl() {
                this.delete("batchControl", "BatchControlSet");
            },

            delete(pModel, pEntity) {
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
                                        if (col.Key == true || col.Key == "X") {
                                            sParam += col.ColumnName + "='" + oContext.getObject()[col.ColumnName] + "',";
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
                this.getMatType(_aSmartFilter, _sSmartFilterGlobal);
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
                            var sDataType = this._aColumns[sTable].filter(col => col.ColumnName === item.name)[0].type;
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

            onCellClickMatType: function(oEvent) {
                var vMatType = oEvent.getParameters().rowBindingContext.getObject().MATTYP;
                this.onCellClick(oEvent);
                _this.onSelectMatType(vMatType);
            },

            onSelectMatType(pMatType) {
                this.getView().getModel("ui").setProperty("/activeMatType", pMatType);

                var oIconTabBarDetail = this.byId("itbDetail");
                if (oIconTabBarDetail.getSelectedKey() == "matClass") {
                    var oIconTabBarMatClass = this.byId("itbMatClass");
                    oIconTabBarMatClass.setSelectedKey("matClass");
                }

                if (pMatType.length > 0) {
                    this.getMatClass();
                    this.getBatchControl();
                } else {
                    this.getView().getModel("matClass").setProperty("/results", []);
                    this.getView().getModel("batchControl").setProperty("/results", []);
                }
                
                // Clear Sort and Filter
                this.clearSortFilter("matClassTab");
                this.clearSortFilter("matAttribTab");
                this.clearSortFilter("batchControlTab");
            },

            onCellClickMatClass(oEvent) {
                var oRow = oEvent.getParameters().rowBindingContext.getObject();
                var vMatClass = oRow.MATTYPCLS;
                var vMatClassSeq = oRow.SEQ;

                this.getView().getModel("ui").setProperty("/activeMatClass", vMatClass);
                this.getView().getModel("ui").setProperty("/activeMatClassSeq", vMatClassSeq);
                
                //this.getMatAttrib();

                this._rowIndex = oEvent.getParameters().rowIndex;
                setTimeout(() => {
                    var oTable = this.getView().byId("matClassTab");
                    var sModel = "matClass";
                    var sRowPath = "/results/" + this._rowIndex;
                    oTable.getModel(sModel).getData().results.forEach(row => row.ACTIVE = "");
                    oTable.getModel(sModel).setProperty(sRowPath + "/ACTIVE", "X");
    
                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext(sModel) && row.getBindingContext(sModel).sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow")
                    })
                }, 1);
            },

            onCellClickMatAttrib(oEvent) {
                this.onCellClick(oEvent);
            },

            onCellClickBatchControl(oEvent) {
                this.onCellClick(oEvent);
            },

            setControlAppAction(pChange) {

                // Material Type
                this.byId("btnAddMatType").setVisible(pChange);
                this.byId("btnEditMatType").setVisible(pChange);
                this.byId("btnAddRowMatType").setVisible(false);
                this.byId("btnRemoveRowMatType").setVisible(false);
                this.byId("btnSaveMatType").setVisible(false);
                this.byId("btnCancelMatType").setVisible(false);
                this.byId("btnDeleteMatType").setVisible(pChange);
                this.byId("btnRefreshMatType").setVisible(true);
                this.byId("btnFullScreenMatType").setVisible(true);
                this.byId("btnExitFullScreenMatType").setVisible(false);
                this.byId("btnTabLayoutMatType").setVisible(true);

                // Material Class
                this.byId("btnAddMatClass").setVisible(pChange);
                this.byId("btnEditMatClass").setVisible(pChange);
                this.byId("btnAddRowMatClass").setVisible(false);
                this.byId("btnRemoveRowMatClass").setVisible(false);
                this.byId("btnSaveMatClass").setVisible(false);
                this.byId("btnCancelMatClass").setVisible(false);
                this.byId("btnDeleteMatClass").setVisible(pChange);
                this.byId("btnRefreshMatClass").setVisible(true);
                this.byId("btnFullScreenMatClass").setVisible(true);
                this.byId("btnExitFullScreenMatClass").setVisible(false);
                this.byId("btnTabLayoutMatClass").setVisible(true);

                // Material Attribute
                this.byId("btnAddMatAttrib").setVisible(pChange);
                this.byId("btnEditMatAttrib").setVisible(pChange);
                this.byId("btnAddRowMatAttrib").setVisible(false);
                this.byId("btnRemoveRowMatAttrib").setVisible(false);
                this.byId("btnSaveMatAttrib").setVisible(false);
                this.byId("btnCancelMatAttrib").setVisible(false);
                this.byId("btnDeleteMatAttrib").setVisible(pChange);
                this.byId("btnRefreshMatAttrib").setVisible(true);
                this.byId("btnFullScreenMatAttrib").setVisible(true);
                this.byId("btnExitFullScreenMatAttrib").setVisible(false);
                this.byId("btnTabLayoutMatAttrib").setVisible(true);

                // Batch Control
                this.byId("btnAddBatchControl").setVisible(pChange);
                this.byId("btnEditBatchControl").setVisible(pChange);
                this.byId("btnAddRowBatchControl").setVisible(false);
                this.byId("btnRemoveRowBatchControl").setVisible(false);
                this.byId("btnSaveBatchControl").setVisible(false);
                this.byId("btnCancelBatchControl").setVisible(false);
                this.byId("btnDeleteBatchControl").setVisible(pChange);
                this.byId("btnRefreshBatchControl").setVisible(true);
                this.byId("btnFullScreenBatchControl").setVisible(true);
                this.byId("btnExitFullScreenBatchControl").setVisible(false);
                this.byId("btnTabLayoutBatchControl").setVisible(true);
            },

            onTabSelect(oEvent) {
                this._selectedTabKey = oEvent.getParameters().selectedKey;
                if (this._selectedTabKey == "matAttrib") {
                    this.getMatAttrib();
                }
            },

            filterGlobally: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTable = oTable.getBindingInfo("rows").model;
                var sQuery = oEvent.getParameter("query");
                var oFilter = null;
                var aFilter = [];

                if (sQuery) {
                    this._aFilterableColumns[sTable].forEach(item => {
                        var sDataType = this._aColumns[sTable].filter(col => col.ColumnName === item.name)[0].type;
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

                if (sTable == "matType") {
                    var aIndices = this.byId(sTable + "Tab").getBinding("rows").aIndices;
                    if (aIndices.length > 0) {
                        var oRow = _this.getView().getModel(sTable).getData().results[aIndices[0]];
                        _this.onSelectMatType(oRow.MATTYP);
                    }

                }
                console.log("filterGlobally", this.byId(sTable + "Tab").getBinding("rows"))
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

            resetVisibleCols(arg) {
                var aData = this.getView().getModel(arg).getData().results;

                this._oDataBeforeChange.results.forEach((item, idx) => {
                    console.log("test1", item)
                    if (item.DELETED) {
                        aData.splice(idx, 0, item)
                    }
                })

                //var aData = this._onData
                this.getView().getModel(arg).setProperty("/results", aData);
            },

            onRowSelectionChangeMatType: function(oEvent) {
                console.log("onRowSelectionChange", oEvent)
                // var indices = e.getParameter('rowIndices'); 
                // for (var i = 0; i < indices.length; i++) {
                //     var idx = indices[i];
                // }
            },

            setControlEditMode(pType, pEditable) {
                if (sap.ushell.Container) sap.ushell.Container.setDirtyFlag(pEditable);

                if (pType == "matClass" || pType == "matAttrib") {
                    var oIconTabBar = this.byId("itbDetail");

                    if (pEditable) {
                        oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                            .forEach(item => item.setProperty("enabled", false));
                    } else {
                        oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                    }

                    var oIconTabBar = this.byId("itbMatClass");
                    if (pEditable) {
                        oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                            .forEach(item => item.setProperty("enabled", false));
                    } else {
                        oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                    }
                } else if (pType == "batchControl") {
                    var oIconTabBar = this.byId("itbDetail");

                    if (pEditable) {
                        oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                            .forEach(item => item.setProperty("enabled", false));
                    } else {
                        oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                    }
                }
            },

            onSaveTableLayout: function (oEvent) {
                //saving of the layout of table
                var me = this;
                var ctr = 1;
                var oTable = oEvent.getSource().oParent.oParent;
                // var oTable = this.getView().byId("mainTab");
                var oColumns = oTable.getColumns();
                var vSBU = this.getView().getModel("ui").getData().sbu;

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
                oDDTextParam.push({CODE: "ITEMS"});
                oDDTextParam.push({CODE: "MTART"});
                oDDTextParam.push({CODE: "MTBEZ"});

                // MessageBox
                oDDTextParam.push({CODE: "INFO_NO_SELECTED"});
                oDDTextParam.push({CODE: "CONF_DISCARD_CHANGE"});
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
                        _this.getView().setModel(oJSONModel, "caption");

                        _oCaption = _this.getView().getModel("caption").getData();
                    },
                    error: function(err) {
                        sap.m.MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });
            },

            onCreate() {
                if (this._sDataMode === "READ" && _this.getView().getModel("base").getProperty("/appChange")) {
                    if (this._sActiveTable === "matTypeTab") { this.onCreateMatType(); }
                    else if (this._sActiveTable === "matClassTab") { this.onCreateMatClass(); }
                    else if (this._sActiveTable === "matAttribTab") { this.onCreateMatAttrib(); }
                    else if (this._sActiveTable === "batchControlTab") { this.onCreateBatchControl(); }
                }
            },

            onEdit() {
                if (this._sDataMode === "READ" && _this.getView().getModel("base").getProperty("/appChange")) {
                    if (this._sActiveTable === "matTypeTab") { this.onEditMatType(); }
                    else if (this._sActiveTable === "matClassTab") { this.onEditMatClass(); }
                    else if (this._sActiveTable === "matAttribTab") { this.onEditMatAttrib(); }
                    else if (this._sActiveTable === "batchControlTab") { this.onEditBatchControl(); }
                }
            },
            
            onDelete() {
                if (this._sDataMode === "READ" && _this.getView().getModel("base").getProperty("/appChange")) {
                    if (this._sActiveTable === "matTypeTab") { this.onDeleteMatType(); }
                    else if (this._sActiveTable === "matClassTab") { this.onDeleteMatClass(); }
                    else if (this._sActiveTable === "matAttribTab") { this.onDeleteMatAttrib(); }
                    else if (this._sActiveTable === "batchControlTab") { this.onDeleteBatchControl(); }
                }
            },
            
            onSubmit() {
                if (this._sDataMode === "NEW" || _sDataMode === "EDIT") {
                    if (this._sActiveTable === "matTypeTab") { this.onSave('matType'); }
                    else if (this._sActiveTable === "matClassTab") { this.onSave('matClass'); }
                    else if (this._sActiveTable === "matAttribTab") { this.onSave('matAttrib'); }
                    else if (this._sActiveTable === "batchControlTab") { this.onSave('batchControl'); }
                }
            },
            
            onCancel() {
                if (this._sDataMode === "NEW" || this._sDataMode === "EDIT") {
                    if (this._sActiveTable === "matTypeTab") { this.onCancelMatType(); }
                    else if (this._sActiveTable === "matClassTab") { this.onCancelMatClass(); }
                    else if (this._sActiveTable === "matAttribTab") { this.onCancelMatAttrib(); }
                    else if (this._sActiveTable === "batchControlTab") { this.onCancelBatchControl(); }
                }
            },           

            onRefresh() {
                if (this._sDataMode === "READ") {
                    if (this._sActiveTable === "matTypeTab") { this.onRefreshMatType(); }
                    else if (this._sActiveTable === "matClassTab") { this.onRefreshMatClass(); }
                    else if (this._sActiveTable === "matAttribTab") { this.onRefreshMatAttrib(); }
                    else if (this._sActiveTable === "batchControlTab") { this.onRefreshBatchControl(); }
                }
            }, 

            getResources: async function(oEvent) {
                var oModel = _this.getOwnerComponent().getModel();
                var promiseResult;
                var oParam = {
                    SBU: _this.getView().getModel("ui").getData().SBU,
                    N_MatType: [],
                    N_GMCRange: [],
                    N_Process: [],
                    N_ExcessMatType: [],
                    N_UV: [],
                    N_BOMAttrib: []                
                }

                promiseResult = new Promise((resolve, reject) => {
                    oModel.create("/ResourceSet", oParam, {
                        method: "POST",
                        success: function (oData, oResponse) {
                            // console.log(oData)
                            _this.getView().setModel(new JSONModel(oData.N_MatType.results), "mattyp");
                            _this.getView().setModel(new JSONModel(oData.N_GMCRange.results), "gmcnrkeycd");
                            _this.getView().setModel(new JSONModel(oData.N_Process.results), "processcd");
                            _this.getView().setModel(new JSONModel(oData.N_ExcessMatType.results), "excmattyp");
                            _this.getView().setModel(new JSONModel(oData.N_UV.results), "usgcls");
                            _this.getView().setModel(new JSONModel(oData.N_BOMAttrib.results), "bomatrb");
                            resolve();
                        },
                        error: function (err) { 
                            resolve();
                        }
                    })
                });
    
                return await promiseResult;
            },

            onSBUChange: function(oEvent) {
                console.log("sbu change")
            },

            _onMultiInputValidate: function(oArgs) {
                var aToken = this._oMultiInput.getTokens();

                if (oArgs.suggestionObject) {
                    var oObject = oArgs.suggestionObject.getBindingContext("materialType").getObject(),
                        oToken = new Token();

                    oToken.setKey(oObject.MaterialType);
                    oToken.setText(oObject.Description + " (" + oObject.MaterialType + ")");
                    aToken.push(oToken)

                    this._oMultiInput.setTokens(aToken);
                    this._oMultiInput.setValueState("None");
                }
                else if (oArgs.text !== "") {
                    this._oMultiInput.setValueState("Error");
                }
    
                return null;
            },

        });
    });
