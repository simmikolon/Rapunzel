//
//  ParallaxScrollingComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class ParallaxScrollingComponent: GKComponent {

    weak var layerEntity: LayerEntity!
    weak var cameraComponent: CameraComponent!
    
    init(withLayerEntity layerEntity: LayerEntity, cameraComponent: CameraComponent) {
        
        self.layerEntity = layerEntity
        self.cameraComponent = cameraComponent
        super.init()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        
        super.update(deltaTime: seconds)
        
        let absoluteCameraPosition = cameraComponent.cameraNode.scene?.convert(cameraComponent.cameraNode.position,
                                                                                    from: cameraComponent.cameraNode.parent!)
        let factor = GameSceneSettings.SmoothingFactor + layerEntity!.parallaxFactor
        
        /* Since Rapunzel is now a vertical-only scroller there is no need to calculate offset for the x axis anymore */
        
        let x: CGFloat = 0.0 //layerEntity.renderComponent.node.position.x - (absoluteCameraPosition!.x / factor)
        
        /* We have to cut off the remainder using round() to stop a strange bug that happens only on Mac OS X SpriteKit Versions */
        /* Side-Effect is that scrolling appears to be a bit more solid since it stops on a "full" pixel */
        /* "Full Pixel" -> is an issue since resolution of Scene is less that todays high resolution of retina screens */
        /* and we have to deal with Sub Pixels !!! */
        
        let y = layerEntity.renderComponent.node.position.y - (round(absoluteCameraPosition!.y) / factor)
        
        layerEntity!.renderComponent.node.position = CGPoint(x: x, y: y)
        
        /* -------------------- DEBUG ------------------ */
        /*
         let className = layerEntity!.name
         print("\(className): \(y) - ABS: \(round(absoluteCameraPosition!.y))")
         */
    }
}
