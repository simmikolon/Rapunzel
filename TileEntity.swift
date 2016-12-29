//
//  TileEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 16.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import Foundation

class TileEntity: Entity {

    let renderComponent: RenderComponent
    
    override init() {
        
        renderComponent = RenderComponent()
        
        super.init()
        
        addComponent(renderComponent)
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    /*
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    */
}
