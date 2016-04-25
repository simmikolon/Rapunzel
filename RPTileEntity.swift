//
//  RPTileEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 16.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class RPTileEntity: RPEntity {

    let renderComponent: RPRenderComponent
    
    override init() {
        
        renderComponent = RPRenderComponent()
        
        super.init()
        
        addComponent(renderComponent)
    }
}
