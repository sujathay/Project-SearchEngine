'use strict';
SearchEngineApp.service('SchemaService', function ($http) {
    var SchemaInfo = [];
    var GetSchema = function () {
        $http.get('http://localhost:35752/PatientService.svc/GetMetadata').then(function (response) {
            //$scope.tables = response;
            SchemaInfo = [{
                rowId: 1, tables: response.tableNames,
                operator: response.Operators,
                groupNo: 1,
                isGrouped: false
            }];
            return SchemaInfo;
        });

    };
    return {
        GetSchema: GetSchema
    };
});
SearchEngineApp.controller("SearchController", function ($scope, $http, $filter, $window, $timeout, UtilSrvc, ngTableParams, SchemaService,
    $rootScope, $dialogs, ngDialog, $location, $compile) {
    $scope.location = $location.search();
    $scope.modalShown = false;
    $scope.toggleModal = function () {
        $scope.modalShown = !$scope.modalShown;
    };
     
    $scope.UnGroup = function (selectedgroupNo) {
        /// <signature>
        ///<summary>Ungroup the items grouped</summary> 
        /// </signature>
        var selectedGroup = $scope.rows.filter(function (item) { return item.groupNo === selectedgroupNo });
        angular.forEach(selectedGroup, function (item) {
            $scope.rows[item.rowId - 1].groupNo = item.rowId;
            $scope.rows[item.rowId - 1].isSelected = false;
            $scope.rows[item.rowId - 1].isGrouped = false;
            $scope.rows[item.rowId - 1].isOR = false;
        });
        $scope.tableParams.reload();
    };
    $scope.GroupOr = function () {
        /// <signature>
        ///<summary>Group the selected item to OR</summary> 
        /// </signature>
        $scope.CombineItem(true);
    };
    $scope.CombineItem = function (isOR) {
        /// <signature>
        ///<summary>Group the selected item to OR/AND </summary> 
        /// </signature>
        $scope.selectedRule = [];

        $scope.selectedRule = $scope.rows.filter(function (item) { return item.isSelected === true });
        var isalreadyGrouped = $scope.selectedRule.filter(function (item) { return item.isGrouped === true }).length;
        if ($scope.selectedRule.length >= 2) {
            if (!isalreadyGrouped) {
                var groupNo = $scope.getRandomSpan();
                angular.forEach($scope.selectedRule, function (item) {
                    $scope.rows[item.rowId - 1].groupNo = groupNo;
                    $scope.rows[item.rowId - 1].isSelected = false;
                    $scope.rows[item.rowId - 1].isGrouped = true;
                    $scope.rows[item.rowId - 1].isOR = isOR;
                });
            }
            else {
                alert(' Individual conditions that are already grouped cannot be included in new groups');
            }
        }
        else {
            alert('To group conditions, select two or more rules.');
        }
        $scope.tableParams.reload();
    };
    $scope.getRandomSpan = function () {
        /// <signature>
        ///<summary>Get random number for group title</summary> 
        /// </signature>
        return Math.random() * 6;
    };
    $scope.GroupAnd = function () {
        /// <signature>
        ///<summary>Group the selected item to OR</summary> 
        /// </signature>
        $scope.CombineItem(false);
    }; 
    $scope.$watchCollection('rows', function (newCol, oldCol, scope) {
        console.log(newCol);
        console.log("newvalue");
        console.log(oldCol);
        console.log(scope);

        //for (var index in newCol) {
        //    var item = newCol[index];
        //    item.order = parseInt(index) + 1;
        //}
    });
    $http.get('http://localhost:35752/PatientService.svc/GetMetadata').success(function (response) {

        $scope.tables = response.tableNames;
        $scope.operator = response.Operators;
        $scope.Configrows = [{
            tables: response.tableNames,
            operator: response.Operators,
            selectedtable: response.tableNames[0],
            configFields: response.ConfiguredFields,
            AlltableSchema: response.AlltableSchema,
           // selectedField: $filter('filter')($scope.tables, { DataTypeId: $scope.tables.DataTypeId })[0]

        }];
        $scope.rows = [{
            rowId: 1,
            groupNo: $scope.getRandomSpan(),
            isGrouped: false,
            //selectedField: $filter('filter')($scope.tables, { DataTypeId: $scope.tables.DataTypeId })[0]
        }];

        if ($scope.location.isedit && $scope.location.id) {
            $scope.isEdit=true;
            var selectedRule = $filter('filter')($scope.allRules, { RuleName: $scope.location.id });
           
            $scope.rows.length = 0;
            angular.forEach(selectedRule, function (item) {
                var isAvailable = $filter('filter')($scope.tables, { tblId: item.tableId });
                if (isAvailable.length<=0) {
                    $scope.tables.push(
                        {
                            "ColId": item.ColId,
                            "ColumnName": item.ColName,
                            "DataTypeId": item.DatatypeSupported,
                            "EntityName": item.EntityName, 
                            "max_length": 8,
                            "tblId": item.tableId,
                            "tblName": item.TableName,
                            "isAvailable":(isAvailable.length>0)?true:false
                            //"selectedOperator": { "OperatorId": item.OperatorId },
                        }
                    );
                }
                $scope.rows.push({                    
                    "selectedtable": { "tblId": item.tableId },
                    "selectedField": { "ColId": item.ColId, "DataTypeId": item.DatatypeSupported, },
                    "selectedOperator": { "OperatorId": item.OperatorId, },
                    "selectedValue": item.SelectedValue, "isGrouped": item.isGrouped, "isOR": item.IsOR,
                    "isSelected": false, "groupNo": item.GroupNo,
                    "isAvailable":(isAvailable.length>0)?true:false
                });
                
            }); 
        }
        else {
            $scope.isEdit=false;
            $scope.GetRule();
        }
        $scope.tableParams = new ngTableParams({
            page: 1,            // show first page
            count: 100          // count per page
        }, {
            counts: [],// hides page sizes
            groupBy: 'groupNo',
            total: $scope.rows.length,
            grouptotal: $scope.rows.length,
            getData: function ($defer, params) {
                var orderedData = params.sorting() ?
                        $filter('orderBy')($scope.rows, $scope.tableParams.orderBy()) :
                        $scope.rows;

                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });
    });
    $scope.SaveRule = function () {
        var data = [];
        angular.forEach($scope.rows, function (item, i) {
            if (item.selectedtable && item.selectedOperator && item.selectedField && item.selectedValue) {
                if (!item.isAvailable) {
                    alert('Sorry one of the table u selected is not available');
                    return false;
                }
                else {
                    data.push({
                        'tblId': item.selectedtable.tblId,
                        'OperatorId': item.selectedOperator.OperatorId,
                        "ColId": item.selectedField.ColId,
                        "isGrouped": item.isGrouped,
                        "groupNo": item.groupNo,
                        "selectedValue": item.selectedValue,
                        "isOR": (item.isOR) ? false : true,
                        "isEdit": ($scope.isEdit) ? $scope.isEdit : false,
                        "RuleName": ($scope.isEdit) ? $scope.location.id : "",
                    });
                }
            } else {
                alert("Please select the rule")
            }
        });
        if (data.length > 0) {
            $http({
                url: 'http://localhost:35752/PatientService.svc/SaveRule?data=' + JSON.stringify(data),
                method: "POST"
            }).success(function (response) {
                $scope.GetRule();
            });
            
        }
        
    };
    $scope.DeleteRule = function () {
        /// <signature>
        ///<summary>Delete rule  </summary> 
        /// </signature>
        alert('are u sure want to delete the rule');
        return false;
    };
    $scope.GetRule = function () {
        $http.get('http://localhost:35752/PatientService.svc/GetRule').success(function (response) {
            $scope.allRules = response;
            var data = {
                colNames: ['Table Name', 'Field Name', 'Operator','', 'Action' ,'dfd' ],
                data: $scope.allRules,
                colModel: [
                     { name: 'TableName',  width: 30, resizable: true},
                     { name: 'ColName', resizable: true, width: 30 },
                     { name: 'SelectedValue', resizable: true, width: 30 },
                     { name: 'ColName', formatter: editLink, resizable: true, width: 5 }, 
                     
                      {
                          name: 'actions', index: 'actions', formatter: 'actions',
                          width: 4,
                          formatoptions: {
                              keys: true,
                              editbutton: false,
                              delOptions: {
                                  afterShowForm: function (form) {
                                      $("#dData").removeClass();
                                      $("#dData").addClass("submit-btn");
                                      $("#eData").removeClass();
                                      $("#eData").addClass("submit-btn");
                                  },
                                  delicon: 'delicon',
                                  msg: 'Are you sure want to delete this rule?',
                                  beforeSubmit: function (id) {
                                      //  Permobil.CustomNotes.Delete(id);
                                      $('.ui-icon-closethick').trigger('click');
                                      return "1";
                                  }
                              }
                          }
                      },
            { name: 'RuleName',width:1, hidden: false }
                ]
            };
            var searchObj = {
                gridID: 'searchGrid',
                ht: 250,
                width: null,
                shrinkToFit: false,
                dataSource: data,
                PageSize: 5,
                sortBy: 'RuleName',
                isDesc: false,
                RefreshGridHandler: null,
                CaptionText: null,
                customActionObj: null,
                gridCompleted: $scope.GridCompleted,
                onRowDelete: null,
                rowDoubleClickHandler: null,
                onSelectRow: null
            };
            SE.CustomGrid.createGrid(searchObj);
        }); 
    };
    $scope.GridCompleted = function (grid) {
        /// <signature>
        ///<summary>On grid complete , hiding header, unneccessary page info in grid pager tab</summary> 
        /// </signature> 
        $(".ui-paging-info").hide();
        $("#lui_searchGrid").hide();
        $("#searchGrid tr.jqgroup:contains('(1)') + .jqgrow + .jqfoot").hide();
        $(".ui-searchGrid-titlebar").hide();
        if ($("#searchGrid").getGridParam("reccount") == 0) {
            $("#pgr_searchGrid_left div").show();
            $("#pgr_searchGrid_right").hide();
        }
        //compiling DOM after table load
        $compile(angular.element('#searchGrid'))($scope);
    };
    function editLink(cellValue, options, rowdata, action) {
        return '<a  href="/#/Search?isedit=true&id=' + rowdata.RuleName + '" ><img src="../images/edit.png"/></a>';
        // <img src="../images/Remove.jpg"  ng-click="DeleteRule()"/>
    }; 
   
    $scope.editrule = function (grid, $window) {
        $location.path("/Search?edit/id=12");
        //$location.search('isedit', 'true').search('id', '12');
    };
    $scope.GetSearch = function () {
        /// <signature>
        ///<summary>Search  </summary> 
        /// </signature>
        var objSearch = [];
        var tableName = "", operators = "", columnName = "", values = "", primarykey = "", isGrouped = "", groupNo = "", isOR = "";
        angular.forEach($scope.rows, function (item) {
            tableName += item.selectedtable.tblName + ",";
            operators += item.selectedOperator.sql_operator + ",";
            columnName += item.selectedField.ColumnName + ",";
            values += item.selectedValue + ",";
            primarykey += item.selectedtable.foreignkeyColName + ",";
            isGrouped += item.isGrouped + ",";
            groupNo += item.groupNo + ",";
            isOR += item.isOR + ",";
        });
        // removing end comma
        tableName = tableName.substring(0, tableName.length - 1);
        operators = operators.substring(0, operators.length - 1);
        columnName = columnName.substring(0, columnName.length - 1);
        values = values.substring(0, values.length - 1);
        primarykey = primarykey.substring(0, primarykey.length - 1);
        isGrouped = isGrouped.substring(0, isGrouped.length - 1);
        groupNo = groupNo.substring(0, groupNo.length - 1);
        isOR = isOR.substring(0, isOR.length - 1);
        objSearch.push({
            'tableName': tableName,
            'columnName': columnName,
            'operators': operators,
            'values': values,
            'primarykey': primarykey,
            'isGrouped': isGrouped,
            'groupNo': groupNo,
            'isOR': isOR
        });
        $http({
            url: 'http://localhost:35752/PatientService.svc/GetSearch?criteria=' + JSON.stringify(objSearch),
            method: "GET"
        }).success(function (response) {
            var data = {
                colNames: ['Age', 'Gender'],
                data: response,
                colModel: [
                     { name: 'PatientName' },
                    { name: 'Address' }
                ]
            };
            var searchObj = {
                gridID: 'searchGrid',
                ht: 250,
                width: 800,
               // shrinkToFit: false,
                dataSource: data,
                PageSize: 1,
                sortBy: 'permobil_name',
                isDesc: false,
                RefreshGridHandler: null,
                CaptionText: null,
                customActionObj: null,
                gridCompleted: null,
                onRowDelete: null,
                rowDoubleClickHandler: null,
                onSelectRow: null
            };
            SE.CustomGrid.createGrid(searchObj);
            console.log(response);
        });
    };
    $scope.GetRule();
    $scope.addNewRow = function () {
        /// <signature>
        ///<summary>Adding new rule</summary> 
        /// </signature>

        if ($scope.rows[$scope.rows.length - 1].selectedField
            && $scope.rows[$scope.rows.length - 1].selectedtable
            && $scope.rows[$scope.rows.length - 1].selectedOperator
            && $scope.rows[$scope.rows.length - 1].selectedValue.length>0) {
            var isDeletedTable = $scope.tables.filter(function (item) { return item.isAvailable === false }); 
            if (isDeletedTable.length > 0) { 
                alert("Table you have selected is not available in db. Please select valid one to proceed");
                return false;
            }
            else {
                $scope.rows.push({
                    rowId: $scope.rows.length + 1, tables: $scope.rows[0]["tables"],
                    operator: $scope.rows[0]["operator"],
                    groupNo: $scope.getRandomSpan(),
                    isGrouped: false
                });
                $scope.tableParams.reload();
            }
        }

    }
    $scope.removeRow = function (item) {
        /// <signature>
        ///<summary>Removing rule</summary> 
        /// </signature>
        $scope.rows.pop({ "rowId": $scope.rows.length + 1 });
        $scope.tableParams.reload();
    };
});

SearchEngineApp.controller('groupCtrl', function ($scope) {
});
