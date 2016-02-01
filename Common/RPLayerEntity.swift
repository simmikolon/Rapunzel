//
//  RPLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import GameplayKit
import SpriteKit

class RPLayerEntity: RPEntity {

    var parallaxFactor: CGFloat = 1.0
    let renderComponent: RPRenderComponent
    var parallaxScrollingComponent: RPParallaxScrollingComponent!
    
    init(withParallaxFactor factor: CGFloat = 1.0, cameraNode: SKCameraNode) {
        
        renderComponent = RPRenderComponent()
        
        super.init()
        
        parallaxFactor = factor
        parallaxScrollingComponent = RPParallaxScrollingComponent(withLayerEntity: self, cameraNode: cameraNode)
        
        addComponent(renderComponent)
        addComponent(parallaxScrollingComponent)
    }
}
