import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  effect,
  signal,
  computed,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { API, APIDefinition, Config, DefaultConfig } from 'ngx-easy-table';
import { Platform } from '@ionic/angular';
import { arrowForwardOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-mft',
  templateUrl: './mft.component.html',
  styleUrls: ['./mft.component.scss'],
})
// multi functional table
export class MftComponent implements OnInit, OnChanges {

  @ViewChild('checkboxTemplate', { static: true }) checkboxTemplate: TemplateRef<any>;

  @Input() label: string;
  @Input() desc: string;
  @Input() tableId: string;
  @Input() checkBox: boolean = false
  @Input() paginationEnabled: boolean = false
  @Input() tableRows = 5;
  @Input() tableMenuOptions: string[] = []
  @Input() tableColumns
  @Input() tableData
  @Input() expandDetails: boolean = false
  @Input() class: string = ''
  // @Input() resetCheckAll = false

  @Input('searchBoxEnable') searchBoxEnable: boolean = false
  @Output() onData = new EventEmitter()
  @Output('onTabSelected') onTabSelected = new EventEmitter()
  @Output('onSearch') onSearch = new EventEmitter()

  //@ts-ignore
  @ViewChild('table', { static: true }) table: APIDefinition;

  @ViewChild('checkAll', { static: false }) checkAll//: IonCheckbox;
  ngOnChanges(): void {
    this.configuration.detailsTemplate = this.expandDetails
    this.configuration.showDetailsArrow = this.expandDetails
  }
  public tab = signal(this.tableMenuOptions[0])

  public tabSelected(tab: string) {
    this.tab.set(tab);
    this.onTabSelected.emit(tab);
    this.table.apiEvent({
      type: API.setPaginationCurrentPage,
      value: 1,
    });
  }

  public configuration: Config = {
    ...DefaultConfig,
    orderEnabled: true,
    // threeWaySort: true,
    showDetailsArrow: true,
    paginationRangeEnabled: false,
    paginationEnabled: false,
    // detailsTemplate: this.expandDetails,
    // infiniteScrollThrottleTime means how often check if scroll reached end on the collection
    // to load the new items. By default set to 200ms.
    infiniteScrollThrottleTime: 20,
    rows: 20,
    // showDetailsArrow: this.expandDetails,
    // fixedColumnWidth: true,
    // horizontalScroll: true,
    isLoading: false,
  };

  public configurationState = computed(() => {
    if (!this.tableData) {
      return {
        isLoading: true,
        paginationEnabled: false,
      };
    }

    const data = this.tableData();
    return {
      isLoading: data === undefined,
      paginationEnabled: data?.length >= this.tableRows,
    };
  });

  ngOnInit(): void {
    this.configuration.checkboxes = this.checkBox
    this.configuration.rows = this.tableRows;

    if (this._platform.width() < 992) {
      this.configuration.horizontalScroll = true;
    }

  }

  previousPage() {
    const res = this.table.apiEvent({
      type: API.getPaginationCurrentPage,
    });
    this.table.apiEvent({
      type: API.setPaginationCurrentPage,
      value: res - 1,
    });

  }
  nextPage() {
    const itemsPerPage = this.tableRows
    let lastPage = this.table.apiEvent({
      type: API.getPaginationTotalItems,
    }) / itemsPerPage;
    const currentPage = this.table.apiEvent({
      type: API.getPaginationCurrentPage,
    });

    if (lastPage > currentPage) {
      this.table.apiEvent({
        type: API.setPaginationCurrentPage,
        value: currentPage + 1,
      });
    }


  }
  constructor(private _platform: Platform) {
    addIcons({arrowForwardOutline})
    effect(() => {
      const { isLoading, paginationEnabled } = this.configurationState();
      this.configuration.isLoading = isLoading;
      this.configuration.paginationEnabled = paginationEnabled;


    });
  }

  public searchTerm = signal('')
  searchItem(term: any) {
    this.searchTerm.set(term);
    this.onSearch.emit(term)

    this.table.apiEvent({
      type: API.onGlobalSearch,
      value: this.searchTerm(),
    });
  }
  public selected = new Set();

  eventEmitted($event: { event: string; value: any }): void {
    // console.log(this.checkAll, $event);

    // const isReallyTrue = this.checkAll.el.checked
    if (['onCheckboxSelect', 'onSelectAll'].includes($event.event)) {
      let data = $event.value;
      switch ($event.event) {
        // case 'onCheckboxSelect':
        // case 'onClick':
        //   if (this.selected.has($event.value.rowId)) {
        //     this.selected.delete($event.value.rowId);
        //   } else {
        //     this.selected.add($event.value.rowId);
        //   }
        //   data = this.tableData().filter((item, index) => 
        //     this.selected.has(index)
        //   ).map(item => ({ ...item, checked: true }));
        //   console.log('checked data', data);
        //   break;
        case 'onSelectAll':
          if ($event.value) {
            data = this.tableData().map(item => ({ ...item, checked: true }))
          } else {
            data = []
          }
          break;
        // case 'onClick':
        //   this.table.apiEvent({
        //     type: API.toggleRowIndex,
        //     value: $event.value.rowId,
        //   });
        //   // check if the data is an array, if yes, remove it from the array if it exists, if data is not an array, return data as new array and with selected data
        //   if (Array.isArray(data)) {
        //     data = data.filter(item => item !== $event.value)
        //   } else {
        //     // find the property in the tabledata array and toggle the checked property
        //     const index = this.tableData().findIndex(item => item.id === $event.value.rowId)
        //     if (index !== -1) {
        //       data = this.tableData().splice(index, 1, { ...this.tableData()[index], checked: !this.tableData()[index].checked })
        //     }
        //   }
        //   break;
      }
      // emit data only if its on of the above cases
      this.onData.emit(data)
    }
  }
}
